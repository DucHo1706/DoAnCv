import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { recruitmentService } from "../../../../services/recruitmentService";
import type { ApplicationDto } from "../../../../services/recruitmentService";
import { jobService } from "../../../../services/jobService";
import type { JobDto } from "../../../../services/jobService";

export function useApplicationManagement() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassification, setFilterClassification] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationDto | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const applicationStatusStages = [
    { status: "Applied", label: "Mới nộp" },
    { status: "Reviewing", label: "Đang xem xét" },
    { status: "Interview", label: "Phỏng vấn" },
    { status: "Offer", label: "Nhận việc (Offer)" },
    { status: "Rejected", label: "Đã từ chối" },
  ];

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetApplication, setRejectTargetApplication] = useState<ApplicationDto | null>(
    null
  );
  const [rejectReasonType, setRejectReasonType] = useState<string | undefined>(undefined);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const rejectReasonOptions = [
    { value: "Thiếu kinh nghiệm", label: "Thiếu kinh nghiệm" },
    { value: "Không phù hợp văn hóa", label: "Không phù hợp văn hóa" },
    { value: "Kỹ năng chưa phù hợp JD", label: "Kỹ năng chưa phù hợp JD" },
    { value: "Mức lương kỳ vọng chưa phù hợp", label: "Mức lương kỳ vọng chưa phù hợp" },
    { value: "Ứng viên không phản hồi", label: "Ứng viên không phản hồi" },
    { value: "Khác", label: "Khác" },
  ];

  const openRejectModal = (application: ApplicationDto) => {
    setRejectTargetApplication(application);
    setRejectReasonType(undefined);
    setRejectNote("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetApplication) {
      message.error("Không tìm thấy hồ sơ cần từ chối.");
      return;
    }

    if (!rejectReasonType) {
      message.warning("Vui lòng chọn lý do từ chối.");
      return;
    }

    try {
      setRejectSubmitting(true);

      await recruitmentService.rejectApplication(rejectTargetApplication.id, {
        reasonType: rejectReasonType,
        note: rejectNote,
      });

      setApplications((previousApplications) =>
        previousApplications.map((application) => {
          if (application.id === rejectTargetApplication.id) {
            return {
              ...application,
              status: "Rejected",
            };
          }
          return application;
        })
      );

      message.success("Đã từ chối hồ sơ và đưa ứng viên vào Talent Pool.");
      setRejectModalOpen(false);
      setRejectTargetApplication(null);
      setRejectReasonType(undefined);
      setRejectNote("");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể từ chối hồ sơ.";
      message.error(errorMessage);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const getStageLabelByStatus = (status?: string) => {
    const foundStage = applicationStatusStages.find((stage) => stage.status === status);
    if (foundStage) return foundStage.label;
    return "Mới nộp";
  };

  const getStatusByStageLabel = (label: string) => {
    const foundStage = applicationStatusStages.find((stage) => stage.label === label);
    if (foundStage) return foundStage.status;
    return "Applied";
  };

  const [kanbanData, setKanbanData] = useState<Record<string, ApplicationDto[]>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appData, jobData] = await Promise.all([
        recruitmentService.getHrApplications(),
        jobService.getMyJobs(),
      ]);
      setApplications(Array.isArray(appData) ? appData : (appData as any)?.$values || []);
      setJobs(Array.isArray(jobData) ? jobData : (jobData as any)?.$values || []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetail = (record: ApplicationDto) => {
    setSelectedApp(record);
    setIsModalOpen(true);
  };

  const parseSkills = (jsonStr: string) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesJob = selectedJobId ? app.jobId === selectedJobId : true;
      const matchesSearch = searchQuery
        ? (app.candidateName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app.email || "").toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesClassification = filterClassification
        ? app.classification === filterClassification
        : true;
      return matchesJob && matchesSearch && matchesClassification;
    });
  }, [applications, selectedJobId, searchQuery, filterClassification]);

  useEffect(() => {
    const groupedData: Record<string, ApplicationDto[]> = {};
    applicationStatusStages.forEach((stage) => {
      groupedData[stage.label] = [];
    });
    filteredApplications.forEach((application) => {
      const stageLabel = getStageLabelByStatus(application.status);
      if (!groupedData[stageLabel]) {
        groupedData[stageLabel] = [];
      }
      groupedData[stageLabel].push(application);
    });
    setKanbanData(groupedData);
  }, [filteredApplications]);

  const handleDragStart = (e: React.DragEvent, appId: string, sourceStage: string) => {
    e.dataTransfer.setData("appId", appId);
    e.dataTransfer.setData("sourceStage", sourceStage);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("appId");
    const sourceStage = e.dataTransfer.getData("sourceStage");

    if (sourceStage === targetStage || !appId) return;

    const targetStatus = getStatusByStageLabel(targetStage);
    if (targetStatus === "Rejected") {
      const targetApplication = applications.find((application) => application.id === appId);
      if (!targetApplication) {
        message.error("Không tìm thấy hồ sơ cần từ chối.");
        return;
      }
      openRejectModal(targetApplication);
      return;
    }

    try {
      await recruitmentService.updateApplicationStatus(appId, targetStatus);
      setApplications((previousApplications) =>
        previousApplications.map((application) => {
          if (application.id === appId) {
            return { ...application, status: targetStatus };
          }
          return application;
        })
      );
      message.success(`Đã chuyển ứng viên sang trạng thái: ${targetStage}`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể cập nhật trạng thái hồ sơ.";
      message.error(errorMessage);
    }
  };

  return {
    navigate,
    applications,
    setApplications,
    jobs,
    selectedJobId,
    setSelectedJobId,
    searchQuery,
    setSearchQuery,
    filterClassification,
    setFilterClassification,
    loading,
    isModalOpen,
    setIsModalOpen,
    selectedApp,
    setSelectedApp,
    viewMode,
    setViewMode,
    applicationStatusStages,
    rejectModalOpen,
    setRejectModalOpen,
    rejectReasonType,
    setRejectReasonType,
    rejectNote,
    setRejectNote,
    rejectSubmitting,
    rejectReasonOptions,
    filteredApplications,
    kanbanData,
    openRejectModal,
    handleConfirmReject,
    handleViewDetail,
    parseSkills,
    handleDragStart,
    handleDrop,
    rejectTargetApplication,
    setRejectTargetApplication,
    getStageLabelByStatus,
    getStatusByStageLabel,
  };
}
