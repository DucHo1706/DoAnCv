import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Upload } from "antd";
import axiosClient from "../../../../services/axiosClient";

export function useJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyFile, setApplyFile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplySuccessModalOpen, setIsApplySuccessModalOpen] = useState(false);
  const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null);
  const [appliedApplication, setAppliedApplication] = useState<any>(null);
  const [isAiPreviewModalOpen, setIsAiPreviewModalOpen] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState<any[]>([]);

  // Default CV states
  const [hasDefaultCv, setHasDefaultCv] = useState(false);
  const [defaultCvName, setDefaultCvName] = useState<string | null>(null);
  const [useDefaultCv, setUseDefaultCv] = useState(false);

  useEffect(() => {
    const fetchDefaultCvStatus = async () => {
      try {
        const res = await axiosClient.get("/profile");
        if (res.data?.defaultCvUrl) {
          setHasDefaultCv(true);
          setDefaultCvName(res.data.defaultCvName);
          setUseDefaultCv(true);
        } else {
          setHasDefaultCv(false);
          setDefaultCvName(null);
          setUseDefaultCv(false);
        }
      } catch (err) {
        // Candidate not logged in or token missing, ignore
      }
    };
    if (isApplyModalOpen) {
      fetchDefaultCvStatus();
    }
  }, [isApplyModalOpen]);

  const getJobId = (jobItem: any) => {
    return jobItem?.id || jobItem?.jobId || jobItem?.jobID || "";
  };

  const getApplicationJobId = (application: any) => {
    return application?.jobId || application?.jobID || "";
  };

  const getApplicationId = (application: any) => {
    return application?.applicationId || application?.id || application?.applicationID || "";
  };

  const normalizeArrayData = (data: any) => {
    if (Array.isArray(data)) {
      return data;
    }
    return data?.$values || [];
  };

  const fetchAppliedApplication = async (currentJobId: string) => {
    try {
      const response = await axiosClient.get("/Recruitment/my-applications");
      const applications = normalizeArrayData(response.data);

      const foundApplication = applications.find((application: any) => {
        return getApplicationJobId(application) === currentJobId;
      });

      if (foundApplication) {
        setAppliedApplication(foundApplication);
      } else {
        setAppliedApplication(null);
      }
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setAppliedApplication(null);
        return;
      }
      console.error("Lỗi kiểm tra trạng thái ứng tuyển:", error);
      setAppliedApplication(null);
    }
  };

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const res = await axiosClient.get(`/Jobs/published/${id}`);
        setJob(res.data);
        const currentJobId = getJobId(res.data);

        const isLoggedIn = !!localStorage.getItem("token");
        if (isLoggedIn && currentJobId) {
          await fetchAppliedApplication(currentJobId);
        }

        const relatedRes = await axiosClient.get(`/Jobs/${id}/related?limit=3`);
        setRelatedJobs(relatedRes.data?.$values || relatedRes.data || []);
      } catch (error) {
        message.error("Không thể tải chi tiết công việc hoặc tin đã hết hạn.");
        navigate("/jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetail();
  }, [id, navigate]);

  const handleApplyWithAI = () => {
    const isLoggedIn = !!localStorage.getItem("token");
    if (!isLoggedIn) {
      message.info("Vui lòng đăng nhập để sử dụng tính năng phân tích AI.");
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setIsAiPreviewModalOpen(true);
  };

  const showApplyModal = () => {
    const isLoggedIn = !!localStorage.getItem("token");
    if (!isLoggedIn) {
      message.info("Vui lòng đăng nhập để nộp hồ sơ ứng tuyển.");
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleCancelApplyModal = () => {
    setIsApplyModalOpen(false);
    setApplyFile(null);
  };

  const handleGoToAiEvaluation = () => {
    setIsApplySuccessModalOpen(false);
    if (submittedApplicationId) {
      navigate(`/my-applications?showAiDetail=${submittedApplicationId}`);
      return;
    }
    navigate("/my-applications");
  };

  const handleViewAppliedAiEvaluation = () => {
    if (!appliedApplication) {
      message.info("Chưa tìm thấy hồ sơ ứng tuyển của bạn cho vị trí này.");
      return;
    }
    const applicationId = getApplicationId(appliedApplication);
    if (!applicationId) {
      message.info("Không tìm thấy mã hồ sơ ứng tuyển.");
      return;
    }
    navigate(`/my-applications?showAiDetail=${applicationId}`);
  };

  const handleDirectApply = async () => {
    if (!useDefaultCv && !applyFile) {
      message.error("Vui lòng chọn file CV của bạn!");
      return;
    }
    if (!job || !job.id) {
      message.error("Không tìm thấy thông tin tin tuyển dụng.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("JobId", job.id);
      formData.append("UseDefaultCv", String(useDefaultCv));
      if (!useDefaultCv && applyFile) {
        formData.append("CvFile", applyFile);
      }

      const response = await axiosClient.post("/Recruitment/apply", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const applicationId =
        response.data?.applicationId || response.data?.data?.applicationId || null;
      const currentJobId = getJobId(job);

      setAppliedApplication({
        id: applicationId,
        applicationId: applicationId,
        jobId: currentJobId,
        aiStatus: "Processing",
        hasAiEvaluation: false,
      });

      setSubmittedApplicationId(applicationId);
      setIsApplyModalOpen(false);
      setApplyFile(null);
      message.success("Nộp hồ sơ thành công!");
      setIsApplySuccessModalOpen(true);
    } catch (error: any) {
      console.log("Lỗi nộp CV:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Đã có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.";

      const existingApplicationId =
        error?.response?.data?.data?.applicationId || error?.response?.data?.applicationId || null;

      if (error?.response?.status === 409 && existingApplicationId) {
        const currentJobId = getJobId(job);
        setAppliedApplication({
          id: existingApplicationId,
          applicationId: existingApplicationId,
          jobId: currentJobId,
        });

        setSubmittedApplicationId(existingApplicationId);
        setIsApplyModalOpen(false);
        setApplyFile(null);
        setIsApplySuccessModalOpen(true);
        return;
      }
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setApplyFile(null);
    },
    beforeUpload: (file: any) => {
      const name = file.name?.toLowerCase() || "";
      const isValidType =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type.startsWith("image/") ||
        name.endsWith(".pdf") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx") ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg");

      if (!isValidType) {
        message.error("Vui lòng chọn đúng file CV (hỗ trợ PDF, DOC, DOCX, PNG, JPG, JPEG).");
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("File CV không được vượt quá 10MB.");
        return Upload.LIST_IGNORE;
      }

      setApplyFile(file);
      return false;
    },
    fileList: applyFile ? [applyFile] : [],
    maxCount: 1,
    accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg",
  };

  return {
    job,
    loading,
    isApplyModalOpen,
    setIsApplyModalOpen,
    applyFile,
    isSubmitting,
    isApplySuccessModalOpen,
    setIsApplySuccessModalOpen,
    appliedApplication,
    isAiPreviewModalOpen,
    setIsAiPreviewModalOpen,
    handleApplyWithAI,
    showApplyModal,
    handleCancelApplyModal,
    handleGoToAiEvaluation,
    handleViewAppliedAiEvaluation,
    handleDirectApply,
    uploadProps,
    navigate,
    relatedJobs,
    hasDefaultCv,
    defaultCvName,
    useDefaultCv,
    setUseDefaultCv,
  };
}
