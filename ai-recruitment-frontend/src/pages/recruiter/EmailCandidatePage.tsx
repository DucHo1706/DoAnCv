import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
  Alert,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  ArrowLeftOutlined,
  LinkOutlined,
  RobotOutlined,
  SendOutlined,
  UploadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import { recruitmentService } from "../../services/recruitmentService";

const { Text, Paragraph } = Typography;

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Nội dung Email...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleCommand = (command: string, commandValue?: string) => {
    if (disabled) {
      return;
    }

    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt("Nhập link cần chèn:");

    if (!url) {
      return;
    }

    handleCommand("createLink", url);
  };

  return (
    <div
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 8,
        overflow: "hidden",
        background: disabled ? "#f5f5f5" : "#ffffff",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
        }}
      >
        <Space wrap>
          <Button
            size="small"
            onClick={() => handleCommand("bold")}
            disabled={disabled}
          >
            <strong>B</strong>
          </Button>

          <Button
            size="small"
            onClick={() => handleCommand("italic")}
            disabled={disabled}
          >
            <em>I</em>
          </Button>

          <Button
            size="small"
            onClick={() => handleCommand("underline")}
            disabled={disabled}
          >
            <u>U</u>
          </Button>

          <Button
            size="small"
            onClick={() => handleCommand("insertUnorderedList")}
            disabled={disabled}
          >
            Bullet
          </Button>

          <Button
            size="small"
            onClick={() => handleCommand("insertOrderedList")}
            disabled={disabled}
          >
            Number
          </Button>

          <Button
            size="small"
            icon={<LinkOutlined />}
            onClick={handleInsertLink}
            disabled={disabled}
          >
            Link
          </Button>

          <Button
            size="small"
            onClick={() => handleCommand("removeFormat")}
            disabled={disabled}
          >
            Clear
          </Button>
        </Space>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        style={{
          minHeight: 310,
          padding: 12,
          outline: "none",
          lineHeight: 1.7,
          fontSize: 14,
          color: "#111827",
        }}
      />

      <style>
        {`
          [contenteditable="true"]:empty:before {
            content: attr(data-placeholder);
            color: #bfbfbf;
          }

          [contenteditable="true"] p {
            margin: 0 0 12px;
          }

          [contenteditable="true"] ul,
          [contenteditable="true"] ol {
            padding-left: 24px;
          }

          [contenteditable="true"] a {
            color: #1677ff;
            text-decoration: underline;
          }
        `}
      </style>
    </div>
  );
}

// Component để chỉnh sửa To/CC emails
function EmailRecipientsEditor({
  toEmail,
  ccEmail,
  onToEmailChange,
  onCcEmailChange,
  onCancel,
}: {
  toEmail: string;
  ccEmail: string;
  onToEmailChange: (email: string) => void;
  onCcEmailChange: (email: string) => void;
  onCancel: () => void;
}) {
  const [localToEmail, setLocalToEmail] = useState(toEmail);
  const [localCcEmail, setLocalCcEmail] = useState(ccEmail);

  const handleSave = () => {
    if (!localToEmail.trim()) {
      message.error("Email người nhận (To) không được để trống.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localToEmail)) {
      message.error("Email người nhận (To) không đúng định dạng.");
      return;
    }

    if (localCcEmail && !emailRegex.test(localCcEmail)) {
      message.error("Email CC không đúng định dạng.");
      return;
    }

    onToEmailChange(localToEmail.trim());
    onCcEmailChange(localCcEmail.trim());
    onCancel();
  };

  return (
    <Modal
      title="Chỉnh sửa người nhận email"
      open={true}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSave}>
          Lưu
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Gửi tới (To) *</Text>
        <Input
          style={{ marginTop: 8 }}
          placeholder="Nhập email người nhận"
          value={localToEmail}
          onChange={(e) => setLocalToEmail(e.target.value)}
          size="large"
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
          Email người nhận (bắt buộc) - thường là email từ CV
        </Text>
      </div>

      <div>
        <Text strong>Sao chép tới (CC)</Text>
        <Input
          style={{ marginTop: 8 }}
          placeholder="Nhập email CC (tùy chọn)"
          value={localCcEmail}
          onChange={(e) => setLocalCcEmail(e.target.value)}
          size="large"
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
          Email sao chép (tùy chọn) - Là email tài khoản nếu khác với email CV
        </Text>
      </div>
    </Modal>
  );
}
type TalentPoolEmailState = {
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
export default function EmailCandidatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const hasGeneratedInitialTalentPoolEmailRef = useRef(false);

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // To/CC emails
  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [isEditingRecipients, setIsEditingRecipients] = useState(false);

  const [attachments, setAttachments] = useState<UploadFile[]>([]);

  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isRejectReasonModalOpen, setIsRejectReasonModalOpen] = useState(false);
  const [isCustomRejectReasonMode, setIsCustomRejectReasonMode] =
    useState(false);
  const [customRejectReason, setCustomRejectReason] = useState("");

  const normalizeSkills = (value: any): string[] => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter((item) => item.trim() !== "");
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item))
            .filter((item) => item.trim() !== "");
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
    if (hasGeneratedInitialTalentPoolEmailRef.current === true) {
      return;
    }

    hasGeneratedInitialTalentPoolEmailRef.current = true;
    setIsGeneratingAi(true);

    try {
      const response = await recruitmentService.generateCandidateEmail({
        emailType: "invite",
        candidateName:
          emailCandidate.candidateName ||
          emailCandidate.fullName ||
          "Ứng viên",
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
        emailContext:
          emailCandidate.emailContext ||
          emailCandidate.talentPoolContext ||
          "",
      });

      if (response.subject) {
        setSubject(response.subject);
      }

      if (response.body) {
        setContent(response.body);
      }

      message.success("AI đã soạn thư mời Talent Pool thành công.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "AI chưa thể soạn thư mời Talent Pool. Vui lòng thử lại.";

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
      // ✅ Add validation
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
      setSubject(
        `[AI Recruitment] Lời mời ứng tuyển vị trí ${talentPoolCandidate.jobTitle}`
      );
      setLoading(false);

      // ✅ Add error handling to async function
      generateInitialTalentPoolInviteEmail(talentPoolCandidate).catch((error) => {
        console.error("Error generating email:", error);
        // Don't block the page, user can manually edit email
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
          setSubject(
            `[AI Recruitment] Kết quả ứng tuyển vị trí ${found.jobTitle}`
          );
        } else {
          message.error("Không tìm thấy ứng viên.");
          // ✅ Validate that we can navigate back
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/recruiter/applications");
          }
        }
      } catch (error: any) {
        // ✅ Check if it's an auth error
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          message.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          // Don't navigate, let axiosClient handle the redirect
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

    if (score > 70) {
      return "success";
    }

    if (score >= 50 && score <= 70) {
      return "warning";
    }

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

  const requestAiGenerateEmail = async (
    emailType: "invite" | "reject",
    rejectReason?: string
  ) => {
    if (!candidate) {
      message.error("Không tìm thấy thông tin ứng viên.");
      return;
    }

    setIsGeneratingAi(true);

    try {
      const response = await recruitmentService.generateCandidateEmail({
        emailType: emailType,
        candidateName:
          candidate.candidateName ||
          candidate.fullName ||
          "Ứng viên",
        jobTitle: candidate.jobTitle || "Vị trí ứng tuyển",
        companyName: "AI Recruitment",
        fitScore: Number(candidate.aiScore || 0),
        classification: candidate.classification || "",
        summary:
          candidate.emailContext ||
          candidate.talentPoolContext ||
          candidate.aiReason ||
          "",
        matchedSkills: normalizeSkills(candidate.matchedSkills),
        missingSkills: normalizeSkills(candidate.missingSkills),
        rejectReason: rejectReason || null,
        emailContext:
          candidate.emailContext ||
          candidate.talentPoolContext ||
          "",
      });

      if (response.subject) {
        setSubject(response.subject);
      }

      if (response.body) {
        setContent(response.body);
      }

      message.success("AI đã soạn email thành công.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "AI chưa thể soạn email. Vui lòng thử lại.";

      message.error(errorMessage);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const generateAiEmail = async (type: "invite" | "reject") => {
    if (!candidate) {
      return;
    }

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
      const newFileList = attachments.filter(
        (item) => item.uid !== file.uid
      );

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
        error?.response?.data?.message ||
        "Gửi email thất bại. Vui lòng thử lại.";

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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageContainer
      title="Soạn Email gửi Ứng viên"
      subtitle="Sử dụng AI để phác thảo email hoặc tự viết nội dung cá nhân hóa."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12 }}>
            {/* Thông tin người nhận email */}
            <div
              style={{
                padding: "12px 16px",
                background: "#f0f5ff",
                borderRadius: 8,
                marginBottom: 16,
                border: "1px solid #b6e3ff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Text strong>
                    {candidate?.candidateName || candidate?.fullName}
                  </Text>

                  <div style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 13 }}>
                      <strong>Gửi tới (To):</strong>{" "}
                      <span
                        style={{
                          color: "#1677ff",
                          fontFamily: "monospace",
                          fontWeight: 500,
                        }}
                      >
                        {toEmail || "Chưa cấu hình"}
                      </span>
                    </Text>
                    {toEmail && candidate?.cvEmail && toEmail === candidate.cvEmail && (
                      <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                        Email từ CV
                      </Tag>
                    )}
                  </div>

                  {ccEmail && (
                    <div style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 13 }}>
                        <strong>(CC):</strong>{" "}
                        <span
                          style={{
                            color: "#faad14",
                            fontFamily: "monospace",
                            fontWeight: 500,
                          }}
                        >
                          {ccEmail}
                        </span>
                      </Text>
                      {candidate?.accountEmail && ccEmail === candidate.accountEmail && (
                        <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>
                          Email tài khoản
                        </Tag>
                      )}
                    </div>
                  )}

                  {/* Giải thích logic To/CC */}
                  <div style={{ marginTop: 8 }}>
                    <Alert
                      type="info"
                      message={
                        <Text style={{ fontSize: 12 }}>
                          {candidate?.cvEmail && candidate?.accountEmail
                            ? candidate.cvEmail === candidate.accountEmail
                              ? "✓ Email CV và tài khoản giống nhau, gửi tới email CV"
                              : `✓ Email CV khác tài khoản, gửi tới email CV và CC email tài khoản`
                            : candidate?.cvEmail
                            ? "✓ Chỉ bóc tách được email CV, gửi tới email CV"
                            : "⚠ Không bóc tách được email ứng viên cung cấp trong CV, nên hiện tại gửi tới email tài khoản ứng viên"}
                        </Text>
                      }
                      style={{ padding: "6px 12px", marginTop: 8 }}
                      showIcon={false}
                    />
                  </div>
                </div>

                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsEditingRecipients(true)}
                  disabled={isSending}
                >
                  Chỉnh sửa
                </Button>
              </div>
            </div>

            <Space
              style={{
                marginBottom: 16,
                width: "100%",
                justifyContent: "flex-end",
              }}
            >
              <Button
                icon={<RobotOutlined />}
                onClick={() => generateAiEmail("invite")}
                disabled={isGeneratingAi || isSending}
                style={{ borderColor: "#52c41a", color: "#52c41a" }}
              >
                {isTalentPoolInvite ? "AI Soạn Thư Mời Talent Pool" : "AI Soạn Thư Mời"}
              </Button>

              {!isTalentPoolInvite && (
                <Button
                  icon={<RobotOutlined />}
                  onClick={() => generateAiEmail("reject")}
                  disabled={isGeneratingAi || isSending}
                  style={{ borderColor: "#ff4d4f", color: "#ff4d4f" }}
                >
                  AI Soạn Thư Từ Chối
                </Button>
              )}
            </Space>

            <Input
              size="large"
              placeholder="Tiêu đề Email"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              style={{ marginBottom: 16 }}
              disabled={isSending}
            />

            <div style={{ position: "relative" }}>
              {isGeneratingAi && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    background: "rgba(255, 255, 255, 0.72)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                >
                  <Spin tip="AI đang phân tích hồ sơ và soạn email..." />
                </div>
              )}

              <RichTextEditor
                value={content}
                onChange={setContent}
                disabled={isSending || isGeneratingAi}
                placeholder="Nội dung Email..."
              />
            </div>

            <Divider />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} disabled={isSending}>
                  Đính kèm file
                </Button>
              </Upload>

              <div style={{ whiteSpace: "nowrap" }}>
                <Button
                  size="large"
                  style={{ marginRight: 12 }}
                  onClick={() => navigate(-1)}
                  disabled={isSending}
                >
                  Hủy bỏ
                </Button>

                <Button
                  size="large"
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendEmail}
                  loading={isSending}
                  disabled={isGeneratingAi}
                >
                  Gửi Email Này
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Gợi ý từ AI Hệ thống"
            style={{ borderRadius: 12, background: "#f8fafc" }}
          >
            <Paragraph>
              Hệ thống đánh giá ứng viên này đạt{" "}
              <Tag color={getScoreColor()}>{candidate?.aiScore} điểm</Tag>.
            </Paragraph>

            <Paragraph type="secondary">
              Khuyến nghị: {getAiRecommendation()}
            </Paragraph>

            <Divider />

            <Text strong style={{ fontSize: 12, color: "#666" }}>
              THÔNG TIN EMAIL
            </Text>
            <div style={{ marginTop: 12, fontSize: 12 }}>
              {candidate?.cvEmail && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Email CV:</Text>
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: "#1677ff",
                      marginTop: 2,
                    }}
                  >
                    {candidate.cvEmail}
                  </div>
                </div>
              )}
              {candidate?.accountEmail && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Email Tài khoản:</Text>
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: "#faad14",
                      marginTop: 2,
                    }}
                  >
                    {candidate.accountEmail}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Modal chỉnh sửa To/CC */}
      {isEditingRecipients && (
        <EmailRecipientsEditor
          toEmail={toEmail}
          ccEmail={ccEmail}
          onToEmailChange={setToEmail}
          onCcEmailChange={setCcEmail}
          onCancel={() => setIsEditingRecipients(false)}
        />
      )}

      {/* Modal lý do từ chối */}
      <Modal
        title="Chọn lý do từ chối"
        open={isRejectReasonModalOpen}
        onCancel={() => {
          setIsRejectReasonModalOpen(false);
          setIsCustomRejectReasonMode(false);
          setCustomRejectReason("");
        }}
        footer={null}
      >
        <Paragraph>
          Ứng viên này có điểm số cao. Vui lòng chọn lý do từ chối để AI soạn thư
          khéo léo và tránh mâu thuẫn với kết quả đánh giá.
        </Paragraph>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button block onClick={() => handleSelectRejectReason("closed")}>
            Đã tuyển đủ người
          </Button>

          <Button block onClick={() => handleSelectRejectReason("career_path")}>
            Định hướng/lộ trình công việc chưa phù hợp
          </Button>

          <Button
            block
            onClick={() => handleSelectRejectReason("overqualified")}
          >
            Overqualified - Kinh nghiệm vượt quá yêu cầu
          </Button>

          <Button
            block
            onClick={() => setIsCustomRejectReasonMode(true)}
          >
            Lý do khác
          </Button>

          {isCustomRejectReasonMode && (
            <div style={{ marginTop: 8 }}>
              <Input
                placeholder="Nhập lý do từ chối cụ thể..."
                value={customRejectReason}
                onChange={(event) => setCustomRejectReason(event.target.value)}
                onPressEnter={handleCreateCustomRejectEmail}
              />

              <Button
                type="primary"
                block
                style={{ marginTop: 12 }}
                onClick={handleCreateCustomRejectEmail}
              >
                Tạo thư từ chối theo lý do này
              </Button>
            </div>
          )}
        </Space>
      </Modal>
    </PageContainer>
  );
}