import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import dayjs from "dayjs";
import { recruitmentService, type ApplicationDto } from "../../../services/recruitmentService";
import { jobService, type JobDto } from "../../../../jobs/services/jobService";
import {
  candidateComparisonService,
  getCandidateComparisonErrorMessage,
  isCandidateEligibleForComparison,
  type CandidateCriterionDefinition,
  type CandidateRankingItem,
  type CandidateRankingSortType,
} from "../../../../../services/candidateComparisonService";
import { removeVietnameseTones } from "../../../../../utils/exportUtils";

export function useCampaignApplications() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();

  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassification, setFilterClassification] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Modal / Drawer states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationDto | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Ranking & Selection states
  const [selectedSortType, setSelectedSortType] = useState<CandidateRankingSortType>("overall");
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
  const [availableCriteria, setAvailableCriteria] = useState<CandidateCriterionDefinition[]>([]);
  const [rankingCandidates, setRankingCandidates] = useState<CandidateRankingItem[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);

  // Reject Modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetApplication, setRejectTargetApplication] = useState<ApplicationDto | null>(null);
  const [rejectReasonType, setRejectReasonType] = useState<string | undefined>(undefined);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Schedule Modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTargetApplication, setScheduleTargetApplication] = useState<ApplicationDto | null>(null);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  const applicationStatusStages = [
    { status: "Applied", label: "Mới nộp" },
    { status: "Reviewing", label: "Đang xem xét" },
    { status: "Interview", label: "Phỏng vấn" },
    { status: "Offer", label: "Nhận việc (Offer)" },
    { status: "Rejected", label: "Đã từ chối" },
  ];

  const rejectReasonOptions = [
    { value: "Thiếu kinh nghiệm", label: "Thiếu kinh nghiệm" },
    { value: "Không phù hợp văn hóa", label: "Không phù hợp văn hóa" },
    { value: "Kỹ năng chưa phù hợp JD", label: "Kỹ năng chưa phù hợp JD" },
    { value: "Mức lương kỳ vọng chưa phù hợp", label: "Mức lương kỳ vọng chưa phù hợp" },
    { value: "Ứng viên không phản hồi", label: "Ứng viên không phản hồi" },
    { value: "Khác", label: "Khác" },
  ];

  const currentJob = useMemo(() => {
    if (!jobId) return null;
    return jobs.find((j) => j.id === jobId) || null;
  }, [jobs, jobId]);

  const parseSkills = (value: string | string[] | undefined) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [appData, jobData] = await Promise.all([
        recruitmentService.getHrApplications(),
        jobService.getMyJobs(),
      ]);
      setApplications(Array.isArray(appData) ? appData : (appData as any)?.$values || []);
      setJobs(Array.isArray(jobData) ? jobData : (jobData as any)?.$values || []);
    } catch (err: any) {
      console.error(err);
      setFetchError("Không thể tải danh sách ứng viên. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates via SignalR
  useEffect(() => {
    let connection: any = null;
    let isSubscribed = true;

    const startSignalR = async () => {
      try {
        const signalR = await import("@microsoft/signalr");
        const apiBase = import.meta.env.VITE_API_URL || "https://recruitinsightai.com/api";
        const hubUrl = apiBase.replace(/\/api\/?$/, "") + "/hubs/ai-evaluation";
        connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl)
          .withAutomaticReconnect()
          .build();

        connection.on("ApplicationStatusChanged", (data: { applicationId: string; status: string }) => {
          if (!isSubscribed) return;
          setApplications((prev) =>
            prev.map((app) => (app.id === data.applicationId ? { ...app, status: data.status } : app))
          );
        });

        connection.on("ReceiveResult", () => {
          if (!isSubscribed) return;
          recruitmentService
            .getHrApplications()
            .then((updatedApps: any) => {
              if (isSubscribed) {
                setApplications(Array.isArray(updatedApps) ? updatedApps : (updatedApps as any)?.$values || []);
              }
            })
            .catch((err: any) => console.error("Lỗi cập nhật danh sách sau chấm điểm AI:", err));
        });

        await connection.start();
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

  // Fetch Rankings for current jobId
  useEffect(() => {
    if (!jobId) {
      setRankingCandidates([]);
      setAvailableCriteria([]);
      setRankingError("");
      return;
    }

    if (selectedSortType === "criterion" && selectedCriterion == null) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setRankingLoading(true);
        setRankingError("");

        const query: {
          sortBy: CandidateRankingSortType;
          criterionName?: string;
          search?: string;
        } = {
          sortBy: selectedSortType,
        };

        if (selectedSortType === "criterion" && selectedCriterion != null) {
          query.criterionName = selectedCriterion;
        }

        if (searchQuery.trim().length > 0) {
          query.search = searchQuery.trim();
        }

        const response = await candidateComparisonService.getCandidateRankings(jobId, query);

        setRankingCandidates(response.candidates);
        setAvailableCriteria(response.availableCriteria);
        setSelectedApplicationIds((previousApplicationIds) =>
          previousApplicationIds.filter((applicationId) =>
            response.candidates.some(
              (candidate: CandidateRankingItem) =>
                candidate.applicationId === applicationId &&
                isCandidateEligibleForComparison(candidate)
            )
          )
        );
      } catch (err: unknown) {
        const errorMessage = getCandidateComparisonErrorMessage(
          err,
          "Không thể tải dữ liệu xếp hạng ứng viên."
        );
        setRankingCandidates([]);
        setAvailableCriteria([]);
        setRankingError(errorMessage);
      } finally {
        setRankingLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [jobId, selectedSortType, selectedCriterion, searchQuery]);

  const rankingApplications = useMemo(() => {
    return rankingCandidates.map((candidate) => {
      const existingApplication = applications.find(
        (application) => application.id === candidate.applicationId
      );

      return {
        id: candidate.applicationId,
        candidateId: candidate.candidateId,
        jobId: candidate.jobId,
        jobTitle: candidate.jobTitle,
        candidateName: candidate.candidateName,
        email: candidate.candidateEmail,
        phone: candidate.candidatePhone,
        cvUrl: candidate.cvUrl,
        aiScore: candidate.aiScore as number,
        aiReason: candidate.summary,
        matchedSkills: candidate.matchedSkills,
        missingSkills: candidate.missingSkills,
        classification: candidate.classification,
        criteriaResults: candidate.criteriaResults as ApplicationDto["criteriaResults"],
        status: existingApplication?.status || candidate.applicationStatus,
        appliedAt: candidate.appliedAt,
        overallRank: candidate.overallRank,
        selectedCriterionRank: candidate.selectedCriterionRank,
        aiDataStatus: candidate.aiDataStatus,
        aiDataMessage: candidate.aiDataMessage,
      };
    });
  }, [applications, rankingCandidates]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterClassification(null);
    setFilterStatus(null);
  };

  const filteredApplications = useMemo(() => {
    const sourceApplications = jobId == null ? applications : rankingApplications;

    return sourceApplications.filter((app) => {
      // Filter strictly by current jobId if present
      if (jobId && app.jobId !== jobId) return false;

      const query = removeVietnameseTones(searchQuery);
      const candName = removeVietnameseTones(app.candidateName || "");
      const email = (app.email || "").toLowerCase();
      const jobTitle = removeVietnameseTones(app.jobTitle || "");
      const phone = (app.phone || "").toLowerCase();

      const matchesSearch =
        query === ""
          ? true
          : candName.includes(query) ||
            email.includes(query) ||
            jobTitle.includes(query) ||
            phone.includes(query);

      const matchesClassification = filterClassification
        ? app.classification === filterClassification
        : true;

      const matchesStatus = filterStatus ? app.status === filterStatus : true;

      return matchesSearch && matchesClassification && matchesStatus;
    });
  }, [applications, rankingApplications, jobId, searchQuery, filterClassification, filterStatus]);

  // Group into Kanban stages
  const kanbanData = useMemo(() => {
    const groupedData: Record<string, ApplicationDto[]> = {};
    applicationStatusStages.forEach((stage) => {
      groupedData[stage.label] = [];
    });
    filteredApplications.forEach((application) => {
      const foundStage = applicationStatusStages.find((s) => s.status === application.status);
      const stageLabel = foundStage ? foundStage.label : "Mới nộp";
      if (!groupedData[stageLabel]) {
        groupedData[stageLabel] = [];
      }
      groupedData[stageLabel].push(application);
    });
    return groupedData;
  }, [filteredApplications]);

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

      setApplications((prev) =>
        prev.map((app) => (app.id === rejectTargetApplication.id ? { ...app, status: "Rejected" } : app))
      );

      message.success("Đã từ chối hồ sơ và đưa ứng viên vào Talent Pool.");
      setRejectModalOpen(false);
      setRejectTargetApplication(null);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể từ chối hồ sơ.");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const openScheduleModal = (application: ApplicationDto) => {
    setScheduleTargetApplication(application);
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = async (values: any) => {
    if (!scheduleTargetApplication) return;
    try {
      setScheduleSubmitting(true);
      const res = await recruitmentService.scheduleInterview(scheduleTargetApplication.id, values);

      setApplications((prev) =>
        prev.map((app) => (app.id === scheduleTargetApplication.id ? { ...app, status: "Interview" } : app))
      );

      message.success("Đã thiết lập lịch phỏng vấn thành công. Đang chuyển hướng sang trang soạn email...");
      setScheduleModalOpen(false);

      const dateStr = dayjs(values.interviewDate).format("DD/MM/YYYY HH:mm");
      const emailContext = `Mời phỏng vấn vào lúc ${dateStr}. Hình thức: ${
        values.format === "Online" ? "Trực tuyến (Online)" : "Trực tiếp tại văn phòng"
      }. Địa điểm/Đường dẫn: ${values.locationOrLink}. ${values.notes ? `Ghi chú thêm: ${values.notes}` : ""}`;

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
            },
          },
        },
      });

      setScheduleTargetApplication(null);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể lập lịch phỏng vấn.");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleStatusChange = async (record: ApplicationDto, newStatus: string) => {
    if (newStatus === "Rejected") {
      openRejectModal(record);
      return;
    }

    try {
      await recruitmentService.updateApplicationStatus(record.id, newStatus);
      setApplications((prev) =>
        prev.map((app) => (app.id === record.id ? { ...app, status: newStatus } : app))
      );
      message.success("Cập nhật trạng thái ứng viên thành công. 🎉");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const handleSortTypeChange = (sortType: CandidateRankingSortType) => {
    setSelectedSortType(sortType);
    setSelectedApplicationIds([]);
    if (sortType === "overall") {
      setSelectedCriterion(null);
      return;
    }
    if (selectedCriterion == null && availableCriteria.length > 0) {
      setSelectedCriterion(availableCriteria[0].criterionName);
    }
  };

  const handleEnableSelection = () => {
    if (!jobId) {
      message.info("Vui lòng chọn một công việc trước khi chọn ứng viên.");
      return;
    }
    if (rankingCandidates.length < 2) {
      message.info("Cần ít nhất 2 ứng viên để thực hiện so sánh.");
      return;
    }
    const eligibleCount = rankingCandidates.filter(isCandidateEligibleForComparison).length;
    if (eligibleCount < 2) {
      message.info("Cần ít nhất 2 ứng viên có dữ liệu AI sử dụng được để thực hiện so sánh.");
      return;
    }
    setSelectedApplicationIds([]);
    setSelectionMode(true);
    setViewMode("table");
  };

  const handleCancelSelection = () => {
    setSelectedApplicationIds([]);
    setSelectionMode(false);
  };

  const handleCompareCandidates = () => {
    if (!jobId || selectedApplicationIds.length < 2) return;
    const encodedJobId = encodeURIComponent(jobId);
    const encodedAppIds = selectedApplicationIds.map((id) => encodeURIComponent(id)).join(",");
    navigate(`/recruiter/ranking/compare?jobId=${encodedJobId}&applicationIds=${encodedAppIds}`);
  };

  const handleViewDetail = (record: ApplicationDto) => {
    setSelectedApp(record);
    setIsModalOpen(true);
  };

  return {
    jobId,
    currentJob,
    navigate,
    loading: loading || rankingLoading,
    fetchError,
    refetch: fetchData,
    searchQuery,
    setSearchQuery,
    filterClassification,
    setFilterClassification,
    filterStatus,
    setFilterStatus,
    handleResetFilters,
    isModalOpen,
    setIsModalOpen,
    selectedApp,
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
    rejectTargetApplication,
    handleConfirmReject,
    scheduleModalOpen,
    setScheduleModalOpen,
    scheduleTargetApplication,
    scheduleSubmitting,
    handleConfirmSchedule,
    filteredApplications,
    kanbanData,
    openRejectModal,
    openScheduleModal,
    handleStatusChange,
    handleViewDetail,
    parseSkills,
    rankingError,
    rankingCandidateCount: rankingCandidates.length,
    eligibleComparisonCandidateCount: rankingCandidates.filter(isCandidateEligibleForComparison).length,
    selectedSortType,
    selectedCriterion,
    setSelectedCriterion,
    availableCriteria,
    handleSortTypeChange,
    selectionMode,
    setSelectionMode,
    selectedApplicationIds,
    setSelectedApplicationIds,
    handleEnableSelection,
    handleCancelSelection,
    handleCompareCandidates,
  };
}
