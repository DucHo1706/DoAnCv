import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import {
  CloseCircleOutlined,
  MessageOutlined,
  SendOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { jobService } from "../../../../../services/jobService";
import type { JobDto } from "../../../../../services/jobService";
import { talentPoolService } from "../../../services/talentPoolService";
import type {
  TalentPoolDetailDto,
  TalentPoolInteractionDto,
  TalentPoolInviteSuggestionDto,
  TalentPoolSuggestedJobDto,
} from "../../../services/talentPoolService";

import type { CategoryDto } from "../../../../../services/jobService";

export function useTalentPoolDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [detail, setDetail] = useState<TalentPoolDetailDto | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [inviteSuggestion, setInviteSuggestion] = useState<TalentPoolInviteSuggestionDto | null>(
    null
  );
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  // Job filtering states
  const [searchJobQuery, setSearchJobQuery] = useState("");
  const [filterJobIndustry, setFilterJobIndustry] = useState<string | null>(null);
  const [filterJobSector, setFilterJobSector] = useState<string | null>(null);
  const [filterJobBranch, setFilterJobBranch] = useState<string | null>(null);
  const [filterJobLevel, setFilterJobLevel] = useState<string | null>(null);

  const handleSelectIndustry = (val: string | null) => {
    setFilterJobIndustry(val);
    setFilterJobSector(null);
  };

  const clearJobFilters = () => {
    setSearchJobQuery("");
    setFilterJobIndustry(null);
    setFilterJobSector(null);
    setFilterJobBranch(null);
    setFilterJobLevel(null);
  };

  const fetchDetail = async () => {
    if (!id) {
      message.error("Không tìm thấy mã ứng viên Talent Pool.");
      return;
    }
    try {
      setLoading(true);
      const data = await talentPoolService.getTalentPoolDetail(id);
      setDetail(data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể tải chi tiết Talent Pool.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await jobService.getMyJobs();
      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        const values = (data as any)?.$values;
        if (Array.isArray(values)) {
          setJobs(values);
        } else {
          setJobs([]);
        }
      }
    } catch (error) {
      message.error("Không thể tải danh sách công việc để dựng UI mời ứng tuyển.");
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await jobService.getCategories();
      setCategories(Array.isArray(data) ? data : (data as any)?.$values || []);
    } catch (e) {
      console.error("Lỗi khi tải categories", e);
    }
  };

  const fetchInviteSuggestions = async () => {
    if (!id) {
      message.error("Không tìm thấy mã ứng viên Talent Pool.");
      return;
    }
    try {
      setSuggestionLoading(true);
      const data = await talentPoolService.getInviteSuggestions(id);
      setInviteSuggestion(data);

      const firstVisibleJob = data.suggestedJobs[0];
      if (firstVisibleJob) {
        setSelectedJobId(firstVisibleJob.jobId);
      } else {
        setSelectedJobId(undefined);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể tải danh sách job gợi ý.";
      message.error(errorMessage);
    } finally {
      setSuggestionLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchJobs();
    fetchCategories();
    fetchInviteSuggestions();
  }, [id]);

  const parseSkills = (skillsData?: string[] | string | null): string[] => {
    if (!skillsData) return [];
    if (Array.isArray(skillsData)) {
      return skillsData
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }

    if (typeof skillsData === "string") {
      try {
        const parsedSkills = JSON.parse(skillsData);
        if (Array.isArray(parsedSkills)) {
          return parsedSkills
            .map((skillItem) => {
              if (typeof skillItem === "string") return skillItem;
              if (skillItem?.name) return skillItem.name;
              if (skillItem?.skillName) return skillItem.skillName;
              if (skillItem?.skill) return skillItem.skill;
              return "";
            })
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0);
        }
        return [];
      } catch {
        return skillsData
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0);
      }
    }
    return [];
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "Chưa cập nhật";
    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) return "Chưa cập nhật";
    return dateValue.toLocaleString("vi-VN");
  };

  const formatJobLabel = (job: JobDto) => {
    const positionName = job.position?.name || "Vị trí";
    const branchName = job.branch?.name || "Chi nhánh";
    return `${positionName} (${branchName})`;
  };

  const isOpenJob = (job: JobDto) => {
    const normalizedStatus = (job.status || "").toLowerCase();
    if (job.isActive === true && job.isApproved === true) return true;
    if (normalizedStatus === "published" || normalizedStatus === "open") return true;
    if (normalizedStatus === "đang mở" || normalizedStatus === "dang mo") return true;
    return false;
  };

  const getTimelineDot = (interaction: TalentPoolInteractionDto) => {
    if (interaction.type === "Rejected") {
      return React.createElement(CloseCircleOutlined, { style: { color: "#EF4444" } });
    }
    if (interaction.type === "HrNote") {
      return React.createElement(MessageOutlined, { style: { color: "#2563EB" } });
    }
    if (interaction.type === "Invited" || interaction.type === "EmailSent") {
      return React.createElement(SendOutlined, { style: { color: "#10B981" } });
    }
    return React.createElement(FileTextOutlined, { style: { color: "#F97316" } });
  };

  const getTimelineColor = (interaction: TalentPoolInteractionDto) => {
    if (interaction.type === "Rejected") return "red";
    if (interaction.type === "HrNote") return "blue";
    if (interaction.type === "Invited" || interaction.type === "EmailSent") return "green";
    return "purple";
  };

  const handleAddNote = async () => {
    if (!id) {
      message.error("Không tìm thấy mã ứng viên Talent Pool.");
      return;
    }
    if (note.trim().length === 0) {
      message.warning("Vui lòng nhập nội dung ghi chú.");
      return;
    }
    try {
      setNoteSubmitting(true);
      await talentPoolService.addTalentPoolNote(id, {
        note: note.trim(),
      });
      message.success("Đã thêm ghi chú.");
      setNote("");
      await fetchDetail();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể thêm ghi chú.";
      message.error(errorMessage);
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Chi tiết Talent Pool là nguồn đầy đủ nhất (bao gồm context sourcing).
  // Invite-suggestions chỉ là dữ liệu tính toán job nên không được phép ghi đè
  // các trường phân loại khi API cũ trả về candidate rút gọn.
  const candidate = detail?.candidate ?? inviteSuggestion?.candidate;
  const skills = parseSkills(candidate?.highlightSkillsJson);

  const visibleSuggestedJobs = useMemo(() => {
    // Vẫn hiển thị các tin đạt 0% để HR biết hệ thống đã đối sánh nhưng
    // chưa tìm thấy bằng chứng phù hợp, thay vì tạo cảm giác API bị lỗi.
    return inviteSuggestion?.suggestedJobs || [];
  }, [inviteSuggestion]);

  const openJobs = useMemo(() => {
    return jobs.filter((job) => isOpenJob(job));
  }, [jobs]);

  const filteredOpenJobs = useMemo(() => {
    return openJobs.filter((job) => {
      const positionName = (job.position?.name || "").toLowerCase();
      const requirements = (job.requirements || "").toLowerCase();
      const description = (job.description || "").toLowerCase();
      const categoryName = (job.category?.name || "").toLowerCase();
      const branchName = (job.branch?.name || "").toLowerCase();
      const levelName = (job.jobLevel?.name || "").toLowerCase();
      const normalizedQuery = searchJobQuery.trim().toLowerCase();
      
      const matchQuery = normalizedQuery
        ? positionName.includes(normalizedQuery) ||
          requirements.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          categoryName.includes(normalizedQuery) ||
          branchName.includes(normalizedQuery) ||
          levelName.includes(normalizedQuery)
        : true;

      let matchIndustry = true;
      if (filterJobIndustry) {
        if (!job.category?.id) {
          matchIndustry = false;
        } else {
          const jobCat = categories.find((c) => c.id === job.category?.id);
          const industryId = job.category?.parentId || jobCat?.parentId || job.category?.id;
          matchIndustry = industryId === filterJobIndustry;
        }
      }

      let matchSector = true;
      if (filterJobSector) {
        matchSector = job.category?.id === filterJobSector;
      }

      let matchBranch = true;
      if (filterJobBranch) {
        matchBranch = job.branch?.id === filterJobBranch;
      }

      const matchLevel = filterJobLevel
        ? job.jobLevel?.name === filterJobLevel
        : true;

      return matchQuery && matchIndustry && matchSector && matchBranch && matchLevel;
    });
  }, [openJobs, searchJobQuery, filterJobIndustry, filterJobSector, filterJobBranch, filterJobLevel, categories]);

  const jobFilterCount = useMemo(() => ({
    total: openJobs.length,
    visible: filteredOpenJobs.length,
  }), [openJobs.length, filteredOpenJobs.length]);

  // Extract distinct levels from open jobs
  const jobLevels = useMemo(() => {
    const levels = new Set<string>();
    openJobs.forEach((job) => {
      if (job.jobLevel?.name) {
        levels.add(job.jobLevel.name);
      }
    });
    return Array.from(levels);
  }, [openJobs]);

  const isSelectedJobValid = useMemo(() => {
    if (!selectedJobId) return false;
    const isSuggestedJob = visibleSuggestedJobs.some((job: any) => job.jobId === selectedJobId);
    const isOpenJobSelected = openJobs.some((job: any) => job.id === selectedJobId);
    return isSuggestedJob || isOpenJobSelected;
  }, [selectedJobId, visibleSuggestedJobs, openJobs]);

  const handleSelectSuggestedJob = (job: TalentPoolSuggestedJobDto) => {
    setSelectedJobId(job.jobId);
    message.success(`Đã chọn job: ${job.jobTitle}`);
  };

  const handleSendInvite = async () => {
    if (!detail) {
      message.error("Không tìm thấy thông tin ứng viên.");
      return;
    }
    if (!selectedJobId) {
      message.warning("Vui lòng chọn job trước khi gửi lời mời.");
      return;
    }
    if (inviteSuggestion?.isLocked === true || detail.candidate.isInviteLocked === true) {
      message.warning(
        inviteSuggestion?.lockReason ||
        detail.candidate.inviteLockReason ||
        "Ứng viên đang tham gia quy trình tuyển dụng ở vị trí khác."
      );
      return;
    }

    try {
      const selectedSuggestedJob = visibleSuggestedJobs.find((job: any) => job.jobId === selectedJobId);
      const selectedOpenJob = openJobs.find((job: any) => job.id === selectedJobId);

      if (!selectedSuggestedJob && !selectedOpenJob) {
        message.warning("Vui lòng chọn một job trước khi gửi lời mời.");
        return;
      }

      const selectedJobForEmail = selectedSuggestedJob
        ? {
          jobId: selectedSuggestedJob.jobId,
          jobTitle: selectedSuggestedJob.jobTitle,
          branchName: selectedSuggestedJob.branchName,
          matchScore: selectedSuggestedJob.matchScore,
          reason: selectedSuggestedJob.reason,
        }
        : {
          jobId: selectedOpenJob!.id,
          jobTitle: selectedOpenJob!.position?.name || formatJobLabel(selectedOpenJob!),
          branchName: selectedOpenJob!.branch?.name || "Chưa cập nhật",
          matchScore: 0,
          reason: "HR tự chọn JD ngoài danh sách AI đề xuất.",
        };

      const candidateForEmail = inviteSuggestion?.candidate ?? detail.candidate;
      if (!candidateForEmail.candidateId || !candidateForEmail.talentPoolCandidateId) {
        message.error("Dữ liệu ứng viên không đầy đủ. Vui lòng thử lại.");
        return;
      }

      message.loading("Đang chuyển hướng...", 0);

      navigate(`/recruiter/candidates/${candidateForEmail.candidateId}/email`, {
        state: {
          source: "talent-pool",
          emailType: "invite",
          emailContext: `Ứng viên Talent Pool - Mời ứng tuyển vị trí ${selectedJobForEmail.jobTitle}`,
          talentPoolCandidateId: candidateForEmail.talentPoolCandidateId,
          selectedJob: {
            jobId: selectedJobForEmail.jobId,
            jobTitle: selectedJobForEmail.jobTitle,
            branchName: selectedJobForEmail.branchName,
            matchScore: selectedJobForEmail.matchScore,
            reason: selectedJobForEmail.reason,
          },
          candidate: {
            id: undefined,
            candidateId: candidateForEmail.candidateId,
            candidateName: candidateForEmail.fullName,
            fullName: candidateForEmail.fullName,
            email: candidateForEmail.email,
            cvEmail: candidateForEmail.email,
            accountEmail: "",
            phone: candidateForEmail.phone,
            jobId: selectedJobForEmail.jobId,
            jobTitle: selectedJobForEmail.jobTitle,
            aiScore: selectedJobForEmail.matchScore,
            classification: "Talent Pool",
            aiReason: selectedJobForEmail.reason,
            matchedSkills: parseSkills(candidateForEmail.highlightSkillsJson),
            missingSkills: [],
            source: "TalentPool",
            emailContext: `Ứng viên Talent Pool - Mời ứng tuyển vị trí ${selectedJobForEmail.jobTitle}`,
          },
        },
      });

      message.destroy();
    } catch (error: any) {
      message.error("Lỗi khi gửi lời mời. Vui lòng thử lại.");
      console.error("Error in handleSendInvite:", error);
    }
  };

  return {
    navigate,
    id,
    detail,
    jobs,
    loading,
    note,
    setNote,
    noteSubmitting,
    inviteSuggestion,
    suggestionLoading,
    selectedJobId,
    setSelectedJobId,
    handleAddNote,
    handleSelectSuggestedJob,
    handleSendInvite,
    parseSkills,
    formatDateTime,
    formatJobLabel,
    isOpenJob,
    getTimelineDot,
    getTimelineColor,
    candidate,
    skills,
    visibleSuggestedJobs,
    openJobs,
    filteredOpenJobs,
    categories,
    jobLevels,
    isSelectedJobValid,
    searchJobQuery,
    setSearchJobQuery,
    filterJobIndustry,
    setFilterJobIndustry,
    filterJobSector,
    setFilterJobSector,
    filterJobBranch,
    setFilterJobBranch,
    filterJobLevel,
    setFilterJobLevel,
    handleSelectIndustry,
    clearJobFilters,
    jobFilterCount,
  };
}
