import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { message, Modal, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { recruitmentService } from "../../../../services/recruitmentService";

export type TalentPoolEmailState = {
  source?: string;
  emailType?: "invite" | "reject";
  context?: string;
  emailContext?: string;
  talentPoolCandidateId?: string;
  selectedJob?: {
    jobId: string;
    jobTitle: string;
    branchName: string;
    matchScore: number;
    reason: string;
  };
  candidate?: any;
};

export function useEmailCandidate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const hasGeneratedInitialTalentPoolEmailRef = useRef(false);

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [isEditingRecipients, setIsEditingRecipients] = useState(false);

  const [attachments, setAttachments] = useState<UploadFile[]>([]);

  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isRejectReasonModalOpen, setIsRejectReasonModalOpen] = useState(false);
  const [isCustomRejectReasonMode, setIsCustomRejectReasonMode] = useState(false);
  const [customRejectReason, setCustomRejectReason] = useState("");

  const normalizeSkills = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter((item) => item.trim() !== "");
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item)).filter((item) => item.trim() !== "");
        }
      } catch {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      }
    }
    return [];
  };

  const generateInitialTalentPoolInviteEmail = async (emailCandidate: any) => {
    if (hasGeneratedInitialTalentPoolEmailRef.current === true) return;
    hasGeneratedInitialTalentPoolEmailRef.current = true;
    setIsGeneratingAi(true);

    try {
      const response = await recruitmentService.generateCandidateEmail({
        emailType: "invite",
        candidateName: emailCandidate.candidateName || emailCandidate.fullName || "Ứng viên",
        jobTitle: emailCandidate.jobTitle || "Vị trí ứng tuyển",
        companyName: "AI Recruitment",
        fitScore: Number(emailCandidate.aiScore || 0),
        classification: emailCandidate.classification || "Talent Pool",
        summary:
          emailCandidate.emailContext ||
          emailCandidate.talentPoolContext ||
          emailCandidate.aiReason ||
          "",
        matchedSkills: normalizeSkills(emailCandidate.matchedSkills),
        missingSkills: normalizeSkills(emailCandidate.missingSkills),
        rejectReason: null,
        emailContext: emailCandidate.emailContext || emailCandidate.talentPoolContext || "",
      });

      if (response.subject) setSubject(response.subject);
      if (response.body) setContent(response.body);
      message.success("AI đã soạn thư mời Talent Pool thành công.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "AI chưa thể soạn thư mời Talent Pool. Vui lòng thử lại.";
      message.error(errorMessage);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    const navigationState = location.state as TalentPoolEmailState | null;

    if (
      navigationState?.source === "talent-pool" &&
      navigationState?.emailType === "invite" &&
      navigationState?.candidate
    ) {
      if (!navigationState.candidate.candidateId) {
        message.error("Dữ liệu ứng viên không đầy đủ.");
        navigate(-1);
        return;
      }

      const emailContext =
        navigationState.emailContext ||
        navigationState.context ||
        `Ứng viên Talent Pool - Mời ứng tuyển vị trí ${navigationState.candidate.jobTitle}`;

      const talentPoolCandidate = {
        ...navigationState.candidate,
        emailContext,
        talentPoolContext: emailContext,
      };

      setCandidate(talentPoolCandidate);
      setToEmail(talentPoolCandidate.cvEmail || talentPoolCandidate.email || "");
      setCcEmail(talentPoolCandidate.accountEmail || "");
      setSubject(`[AI Recruitment] Lời mời ứng tuyển vị trí ${talentPoolCandidate.jobTitle}`);
      setLoading(false);

      generateInitialTalentPoolInviteEmail(talentPoolCandidate).catch((error) => {
        console.error("Error generating email:", error);
      });
      return;
    }

    const fetchCandidate = async () => {
      try {
        const data = await recruitmentService.getHrApplications();
        const apps = Array.isArray(data) ? data : (data as any)?.$values || [];
        const found = apps.find((app: any) => app.id === id);

        if (found) {
          setCandidate(found);
          setToEmail(found.suggestedToEmail || found.email || "");
          setCcEmail(found.suggestedCcEmail || "");
          setSubject(`[AI Recruitment] Kết quả ứng tuyển vị trí ${found.jobTitle}`);
        } else {
          message.error("Không tìm thấy ứng viên.");
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/recruiter/applications");
          }
        }
      } catch (error: any) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          message.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }
        message.error("Lỗi khi tải thông tin ứng viên.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id, navigate, location.state]);

  const getPlainTextFromHtml = (html: string) => {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  const hasPlaceholder = (html: string) => {
    return /\[[^\]]+\]/.test(html);
  };

  const getScoreColor = () => {
    const score = Number(candidate?.aiScore || 0);
    if (score > 70) return "success";
    if (score >= 50 && score <= 70) return "warning";
    return "error";
  };

  const getAiRecommendation = () => {
    const score = Number(candidate?.aiScore || 0);
    if (score > 70) {
      return "Nên sắp xếp phỏng vấn ngay trong tuần này vì ứng viên có kỹ năng rất sát với yêu cầu.";
    }
    if (score >= 50 && score <= 70) {
      return "Có thể cân nhắc thêm hoặc đưa vào danh sách theo dõi nếu vị trí còn thiếu ứng viên phù hợp.";
    }
    return "Nên cân nhắc kỹ trước khi mời phỏng vấn vì mức độ phù hợp hiện tại còn thấp.";
  };

  const requestAiGenerateEmail = async (emailType: "invite" | "reject", rejectReason?: string) => {
    if (!candidate) {
      message.error("Không tìm thấy thông tin ứng viên.");
      return;
    }
    setIsGeneratingAi(true);

    try {
      const response = await recruitmentService.generateCandidateEmail({
        emailType: emailType,
        candidateName: candidate.candidateName || candidate.fullName || "Ứng viên",
        jobTitle: candidate.jobTitle || "Vị trí ứng tuyển",
        companyName: "AI Recruitment",
        fitScore: Number(candidate.aiScore || 0),
        classification: candidate.classification || "",
        summary: candidate.emailContext || candidate.talentPoolContext || candidate.aiReason || "",
        matchedSkills: normalizeSkills(candidate.matchedSkills),
        missingSkills: normalizeSkills(candidate.missingSkills),
        rejectReason: rejectReason || null,
        emailContext: candidate.emailContext || candidate.talentPoolContext || "",
      });

      if (response.subject) setSubject(response.subject);
      if (response.body) setContent(response.body);
      message.success("AI đã soạn email thành công.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "AI chưa thể soạn email. Vui lòng thử lại.";
      message.error(errorMessage);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const generateAiEmail = async (type: "invite" | "reject") => {
    if (!candidate) return;
    if (type === "invite") {
      await requestAiGenerateEmail("invite");
      return;
    }

    const score = Number(candidate?.aiScore || 0);
    if (score >= 70) {
      setIsCustomRejectReasonMode(false);
      setCustomRejectReason("");
      setIsRejectReasonModalOpen(true);
      return;
    }

    await requestAiGenerateEmail(
      "reject",
      "Hồ sơ hiện chưa hoàn toàn phù hợp với định hướng tuyển dụng cho vị trí này."
    );
  };

  const handleSelectRejectReason = async (reason: string) => {
    let rejectReason = "";
    if (reason === "closed") {
      rejectReason =
        "Quá trình tuyển dụng cho vị trí này đã hoàn tất và công ty đã chốt đủ chỉ tiêu tuyển dụng.";
    } else if (reason === "career_path") {
      rejectReason =
        "Định hướng phát triển và lộ trình công việc hiện tại của ứng viên chưa thực sự phù hợp với cấu trúc và mục tiêu gắn bó dài hạn mà đội ngũ đang tìm kiếm.";
    } else if (reason === "overqualified") {
      rejectReason =
        "Hồ sơ và kinh nghiệm của ứng viên vượt xa yêu cầu của vị trí hiện tại, vị trí này có thể chưa mang lại đủ không gian phát triển tương xứng.";
    }

    setIsRejectReasonModalOpen(false);
    setIsCustomRejectReasonMode(false);
    await requestAiGenerateEmail("reject", rejectReason);
  };

  const handleCreateCustomRejectEmail = async () => {
    if (!customRejectReason.trim()) {
      message.warning("Vui lòng nhập lý do từ chối cụ thể.");
      return;
    }
    setIsRejectReasonModalOpen(false);
    setIsCustomRejectReasonMode(false);
    await requestAiGenerateEmail("reject", customRejectReason.trim());
  };

  const uploadProps: UploadProps = {
    multiple: true,
    fileList: attachments,
    beforeUpload: (file) => {
      const maxSizeInMb = 10;
      const isValidSize = file.size / 1024 / 1024 <= maxSizeInMb;
      if (!isValidSize) {
        message.error(`File ${file.name} vượt quá ${maxSizeInMb}MB.`);
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) => {
      setAttachments(info.fileList);
    },
    onRemove: (file) => {
      const newFileList = attachments.filter((item) => item.uid !== file.uid);
      setAttachments(newFileList);
    },
  };

  const getAttachmentFiles = () => {
    const files: File[] = [];
    attachments.forEach((uploadFile) => {
      if (uploadFile.originFileObj) {
        files.push(uploadFile.originFileObj as File);
      }
    });
    return files;
  };

  const sendEmailRequest = async () => {
    if (!candidate) {
      message.error("Không tìm thấy thông tin ứng viên.");
      return;
    }
    if (!toEmail.trim()) {
      message.error("Email người nhận (To) không được để trống.");
      return;
    }
    if (!subject.trim()) {
      message.error("Vui lòng nhập tiêu đề email.");
      return;
    }

    const plainTextContent = getPlainTextFromHtml(content);
    if (!plainTextContent) {
      message.error("Vui lòng nhập nội dung email.");
      return;
    }

    setIsSending(true);
    try {
      await recruitmentService.sendCandidateEmail({
        applicationId: candidate.id,
        toEmail: toEmail.trim(),
        ccEmail: ccEmail.trim(),
        subject: subject,
        body: content,
        isHtml: true,
        attachments: getAttachmentFiles(),
      });

      const ccText = ccEmail.trim() ? ` (CC: ${ccEmail.trim()})` : "";
      message.success(`Đã gửi email thành công tới ${toEmail.trim()}${ccText}`);
      navigate(-1);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Gửi email thất bại. Vui lòng thử lại.";
      message.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (hasPlaceholder(content)) {
      Modal.confirm({
        title: "Email còn nội dung chưa được điền",
        content:
          "Trong email vẫn còn placeholder như [Điền thời gian], [Link họp] hoặc nội dung tương tự. Bạn có chắc chắn muốn gửi không?",
        okText: "Gửi vẫn gửi",
        cancelText: "Quay lại chỉnh sửa",
        onOk: async () => {
          await sendEmailRequest();
        },
      });
      return;
    }
    await sendEmailRequest();
  };

  const isTalentPoolInvite =
    candidate?.source === "TalentPool" ||
    String(candidate?.emailContext || candidate?.talentPoolContext || "")
      .toLowerCase()
      .includes("talent pool");

  return {
    navigate,
    candidate,
    loading,
    subject,
    setSubject,
    content,
    setContent,
    toEmail,
    setToEmail,
    ccEmail,
    setCcEmail,
    isEditingRecipients,
    setIsEditingRecipients,
    attachments,
    isSending,
    isGeneratingAi,
    isRejectReasonModalOpen,
    setIsRejectReasonModalOpen,
    isCustomRejectReasonMode,
    setIsCustomRejectReasonMode,
    customRejectReason,
    setCustomRejectReason,
    getScoreColor,
    getAiRecommendation,
    generateAiEmail,
    handleSelectRejectReason,
    handleCreateCustomRejectEmail,
    uploadProps,
    handleSendEmail,
    isTalentPoolInvite,
  };
}
