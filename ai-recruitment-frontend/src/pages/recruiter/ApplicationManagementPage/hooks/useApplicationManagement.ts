import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import dayjs from "dayjs";
import { recruitmentService } from "../../../../services/recruitmentService";
import type { ApplicationDto } from "../../../../services/recruitmentService";
import { jobService } from "../../../../services/jobService";
import type { JobDto } from "../../../../services/jobService";

export function useApplicationManagement() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("jobId");
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassification, setFilterClassification] = useState<string | null>(null);
  const [searchSkill, setSearchSkill] = useState("");
  const [minScore, setMinScore] = useState<number | null>(null);
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

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTargetApplication, setScheduleTargetApplication] = useState<ApplicationDto | null>(null);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

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

  const openScheduleModal = (application: ApplicationDto) => {
    setScheduleTargetApplication(application);
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = async (values: {
    interviewDate: string;
    format: string;
    locationOrLink: string;
    notes?: string;
    meetingId?: string;
    passcode?: string;
  }) => {
    if (!scheduleTargetApplication) return;
    try {
      setScheduleSubmitting(true);
      const res = await recruitmentService.scheduleInterview(scheduleTargetApplication.id, values);

      setApplications((previousApplications) =>
        previousApplications.map((application) => {
          if (application.id === scheduleTargetApplication.id) {
            return {
              ...application,
              status: "Interview",
            };
          }
          return application;
        })
      );

      message.success("Đã thiết lập lịch phỏng vấn thành công. Đang chuyển hướng sang trang soạn email...");
      setScheduleModalOpen(false);

      const dateStr = dayjs(values.interviewDate).format("DD/MM/YYYY HH:mm");
      const emailContext = `Mời phỏng vấn vào lúc ${dateStr}. Hình thức: ${values.format === "Online" ? "Trực tuyến (Online)" : "Trực tiếp tại văn phòng"}. Địa điểm/Đường dẫn: ${values.locationOrLink}. ${values.notes ? `Ghi chú thêm: ${values.notes}` : ""}`;

      navigate(`/recruiter/candidates/${scheduleTargetApplication.id}/email`, {
        state: {
          source: "interview-schedule",
          emailType: "invite",
          emailContext,
          candidate: {
            id: scheduleTargetApplication.id,
            candidateId: scheduleTargetApplication.id,
            candidateName: scheduleTargetApplication.candidateName,
            fullName: scheduleTargetApplication.candidateName,
            jobTitle: scheduleTargetApplication.jobTitle,
            aiScore: scheduleTargetApplication.aiScore || 0,
            classification: scheduleTargetApplication.classification || "Đạt yêu cầu",
            aiReason: scheduleTargetApplication.aiReason || "",
            matchedSkills: parseSkills(scheduleTargetApplication.matchedSkills || ""),
            missingSkills: parseSkills(scheduleTargetApplication.missingSkills || ""),
            cvEmail: scheduleTargetApplication.email,
            accountEmail: scheduleTargetApplication.email,
            schedule: res.data?.schedule || {
              interviewDate: values.interviewDate,
              format: values.format,
              locationOrLink: values.locationOrLink,
            }
          }
        }
      });

      setScheduleTargetApplication(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể lập lịch phỏng vấn.";
      message.error(errorMessage);
    } finally {
      setScheduleSubmitting(false);
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

  // Real-time updates using SignalR
  useEffect(() => {
    let connection: any = null;
    let isSubscribed = true;

    const startSignalR = async () => {
      try {
        const signalR = await import("@microsoft/signalr");
        const apiBase = import.meta.env.VITE_API_URL || "https://localhost:7006/api";
        const hubUrl = apiBase.replace(/\/api\/?$/, "") + "/hubs/ai-evaluation";
        connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl)
          .withAutomaticReconnect()
          .build();

        // Cập nhật trạng thái Kanban thời gian thực khi HR khác thay đổi trạng thái
        connection.on("ApplicationStatusChanged", (data: { applicationId: string; status: string }) => {
          if (!isSubscribed) return;
          setApplications((prev) =>
            prev.map((app) => (app.id === data.applicationId ? { ...app, status: data.status } : app))
          );
        });

        // Tự động tải lại điểm số/tags AI khi chấm xong ngầm
        connection.on("ReceiveResult", () => {
          if (!isSubscribed) return;
          recruitmentService.getHrApplications().then((updatedApps) => {
            if (isSubscribed) {
              setApplications(Array.isArray(updatedApps) ? updatedApps : (updatedApps as any)?.$values || []);
            }
          }).catch((err: any) => console.error("Lỗi cập nhật danh sách sau chấm điểm AI:", err));
        });

        await connection.start();
        console.log("[SignalR] Recruiter connected to AI Hub!");
      } catch (err: any) {
        console.warn("[SignalR] Kết nối SignalR thất bại, sử dụng fallback.", err);
      }
    };

    startSignalR();

    return () => {
      isSubscribed = false;
      if (connection) {
        connection.stop().catch((err: any) => console.error("[SignalR] Stop error", err));
      }
    };
  }, []);

  const handleViewDetail = (record: ApplicationDto) => {
    setSelectedApp(record);
    setIsModalOpen(true);
  };

  const parseSkills = (jsonStr: string | string[]) => {
    if (!jsonStr) return [];
    if (Array.isArray(jsonStr)) return jsonStr;
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
      const matchesSkill = searchSkill
        ? (Array.isArray(app.matchedSkills) ? app.matchedSkills.join(",") : (app.matchedSkills || "")).toLowerCase().includes(searchSkill.toLowerCase()) ||
          (Array.isArray(app.missingSkills) ? app.missingSkills.join(",") : (app.missingSkills || "")).toLowerCase().includes(searchSkill.toLowerCase())
        : true;
      const matchesMinScore = minScore !== null
        ? app.aiScore >= minScore
        : true;
      return matchesJob && matchesSearch && matchesClassification && matchesSkill && matchesMinScore;
    });
  }, [applications, selectedJobId, searchQuery, filterClassification, searchSkill, minScore]);

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

    if (targetStatus === "Interview") {
      const targetApplication = applications.find((application) => application.id === appId);
      if (!targetApplication) {
        message.error("Không tìm thấy hồ sơ cần phỏng vấn.");
        return;
      }
      openScheduleModal(targetApplication);
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

  const jobsWithStats = useMemo(() => {
    return jobs.map((job) => {
      const jobApps = applications.filter((app) => app.jobId === job.id);
      return {
        ...job,
        stats: {
          total: jobApps.length,
          newApps: jobApps.filter((app) => app.status === "Applied").length,
          interviewing: jobApps.filter((app) => app.status === "Interview").length,
          hired: jobApps.filter((app) => app.status === "Offer").length,
        }
      };
    });
  }, [jobs, applications]);

  return {
    navigate,
    applications,
    setApplications,
    jobs,
    jobsWithStats,
    selectedJobId,
    setSelectedJobId,
    searchQuery,
    setSearchQuery,
    filterClassification,
    setFilterClassification,
    searchSkill,
    setSearchSkill,
    minScore,
    setMinScore,
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
    scheduleModalOpen,
    setScheduleModalOpen,
    scheduleTargetApplication,
    scheduleSubmitting,
    openScheduleModal,
    handleConfirmSchedule,
  };
}
