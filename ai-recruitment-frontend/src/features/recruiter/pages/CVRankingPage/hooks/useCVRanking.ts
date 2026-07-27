import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  candidateComparisonService,
  type CandidateCriterionResult,
  type CandidateRankingItem,
  type CandidateRankingSortType,
} from "../../../../../services/candidateComparisonService";
import { jobService, type JobDto } from "../../../../../services/jobService";
import { recruitmentService, type ApplicationDto } from "../../../../../services/recruitmentService";

export function useCVRanking() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [allCandidates, setAllCandidates] = useState<CandidateRankingItem[]>([]);
  const [candidateList, setCandidateList] = useState<CandidateRankingItem[]>([]);
  const [availableCriteria, setAvailableCriteria] = useState<
    Array<{ criterionName: string; weight: number; maxScore: number }>
  >([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSortType, setSelectedSortType] =
    useState<CandidateRankingSortType>("overall");
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRankingItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [jobData, applicationData] = await Promise.all([
          jobService.getMyJobs(),
          recruitmentService.getHrApplications(),
        ]);

        const normalizedJobs = Array.isArray(jobData)
          ? jobData
          : ((jobData as { $values?: JobDto[] })?.$values ?? []);
        const normalizedApplications = Array.isArray(applicationData)
          ? applicationData
          : ((applicationData as { $values?: ApplicationDto[] })?.$values ?? []);
        const normalizedCandidates = mapApplicationsToRankingItems(normalizedApplications);

        setJobs(normalizedJobs);
        setAllCandidates(normalizedCandidates);
        setCandidateList(normalizedCandidates);
      } catch {
        setErrorMessage("Không thể tải danh sách công việc và hồ sơ ứng viên.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedJobId == null) {
      const normalizedKeyword = searchKeyword.trim().toLocaleLowerCase("vi");
      let filteredCandidates = allCandidates;

      if (normalizedKeyword.length > 0) {
        filteredCandidates = allCandidates.filter((candidate) => {
          const candidateName = candidate.candidateName.toLocaleLowerCase("vi");
          const candidateEmail = candidate.candidateEmail.toLocaleLowerCase("vi");
          return (
            candidateName.includes(normalizedKeyword) ||
            candidateEmail.includes(normalizedKeyword)
          );
        });
      }

      setCandidateList(filteredCandidates);
      setAvailableCriteria([]);
      setErrorMessage("");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

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

        if (searchKeyword.trim().length > 0) {
          query.search = searchKeyword.trim();
        }

        const response = await candidateComparisonService.getCandidateRankings(
          selectedJobId,
          query
        );

        setCandidateList(Array.isArray(response.candidates) ? response.candidates : []);
        setAvailableCriteria(
          Array.isArray(response.availableCriteria) ? response.availableCriteria : []
        );
      } catch (error: unknown) {
        const apiMessage = getApiErrorMessage(error);
        setCandidateList([]);
        setAvailableCriteria([]);
        setErrorMessage(apiMessage);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [selectedJobId, selectedSortType, selectedCriterion, searchKeyword, allCandidates]);

  const handleJobChange = (jobId: string | null) => {
    setSelectedJobId(jobId);
    setSelectedSortType("overall");
    setSelectedCriterion(null);
    setSelectedApplicationIds([]);
    setSelectionMode(false);
    setSelectedCandidate(null);
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
    if (selectedJobId == null) {
      message.info("Vui lòng chọn một công việc trước khi chọn ứng viên.");
      return;
    }

    setSelectedApplicationIds([]);
    setSelectionMode(true);
  };

  const handleCancelSelection = () => {
    setSelectedApplicationIds([]);
    setSelectionMode(false);
  };

  const handleCompareCandidates = () => {
    if (selectedJobId == null || selectedApplicationIds.length < 2) {
      return;
    }

    const encodedJobId = encodeURIComponent(selectedJobId);
    const encodedApplicationIds = selectedApplicationIds
      .map((applicationId) => encodeURIComponent(applicationId))
      .join(",");

    navigate(
      `/recruiter/ranking/compare?jobId=${encodedJobId}&applicationIds=${encodedApplicationIds}`
    );
  };

  const selectedCriterionDefinition = useMemo(() => {
    return availableCriteria.find(
      (criterion) => criterion.criterionName === selectedCriterion
    );
  }, [availableCriteria, selectedCriterion]);

  const topCandidate = candidateList.find((candidate) => {
    if (selectedSortType === "criterion") {
      return candidate.selectedCriterionRank === 1;
    }

    return candidate.overallRank === 1;
  });

  return {
    navigate,
    jobs,
    allCandidates,
    candidateList,
    availableCriteria,
    selectedJobId,
    searchKeyword,
    setSearchKeyword,
    selectedSortType,
    selectedCriterion,
    setSelectedCriterion,
    selectedApplicationIds,
    setSelectedApplicationIds,
    selectionMode,
    selectedCandidate,
    setSelectedCandidate,
    loading,
    errorMessage,
    handleJobChange,
    handleSortTypeChange,
    handleEnableSelection,
    handleCancelSelection,
    handleCompareCandidates,
    selectedCriterionDefinition,
    topCandidate,
  };
}

function mapApplicationsToRankingItems(
  applications: ApplicationDto[]
): CandidateRankingItem[] {
  return applications
    .slice()
    .sort((a, b) => (((b as any).aiMatchScore ?? (b as any).fitScore ?? -1) - ((a as any).aiMatchScore ?? (a as any).fitScore ?? -1)))
    .map((application, index) => {
      let aiDataStatus: CandidateRankingItem["aiDataStatus"] = "ready";
      let aiDataMessage = "Dữ liệu AI đầy đủ.";
      let aiScore = (application as any).aiMatchScore ?? (application as any).fitScore ?? null;

      if (application.classification === "AI_ERROR") {
        aiDataStatus = "error";
        aiDataMessage = "AI chưa thể hoàn tất đánh giá hồ sơ này.";
        aiScore = null;
      } else if (
        !application.classification ||
        application.classification === "Chưa phân loại"
      ) {
        aiDataStatus = "missing";
        aiDataMessage = "Hồ sơ chưa có đánh giá AI.";
        aiScore = null;
      }

      return {
        applicationId: application.id,
        candidateId: "",
        candidateName: application.candidateName,
        candidateEmail: application.email,
        candidatePhone: application.phone,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        applicationStatus: application.status || "",
        appliedAt: application.appliedAt || "",
        cvUrl: application.cvUrl,
        aiScore,
        overallRank: aiScore == null ? null : index + 1,
        selectedCriterionRank: null,
        classification: application.classification || "Chưa phân loại",
        summary: "Chọn một công việc cụ thể để xem dữ liệu AI đã chuẩn hóa.",
        aiDataStatus,
        aiDataMessage,
        matchedSkills: normalizeStringList(application.matchedSkills),
        missingSkills: normalizeStringList(application.missingSkills),
        strengths: [],
        weaknesses: [],
        degree: "",
        major: "",
        university: "",
        yearsOfExperience: null,
        certificates: [],
        criteriaResults: [],
      };
    });
}

function normalizeStringList(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
  }

  return [];
}

function getApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error != null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return "Không thể tải dữ liệu xếp hạng. Vui lòng thử lại.";
}
