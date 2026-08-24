import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { jobService, type JobDto, type RecruiterCampaignSummaryDto } from "../../../services/jobService";
import { recruitmentService, type ApplicationDto } from "../../../services/recruitmentService";
import {
  useRealtimeNotificationRefresh,
  useRealtimeResourceRefresh,
  type RealtimeNotificationEventDetail,
} from "../../../../../hooks/useRealtimeRefresh";
import { removeVietnameseTones } from "../../../../../utils/exportUtils";
import { resolveJobLifecycle } from "../../../../../utils/jobLifecycle";

type CampaignStats = {
  total: number;
  newApps: number;
  interviewing: number;
  offers: number;
  hired: number;
};

export type RecruiterCampaignItem = Omit<RecruiterCampaignSummaryDto, "stats"> & {
  stats: CampaignStats;
};

type DateRange = [Dayjs | null, Dayjs | null] | null;

function asArray<T>(value: T[] | { $values?: T[] } | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value?.$values || [];
}

function buildCampaignsFromLegacyData(
  jobs: JobDto[],
  applications: ApplicationDto[],
): RecruiterCampaignItem[] {
  const statsByJob = new Map<string, CampaignStats>();
  applications.forEach((application) => {
    const stats = statsByJob.get(application.jobId) || {
      total: 0,
      newApps: 0,
      interviewing: 0,
      offers: 0,
      hired: 0,
    };
    stats.total += 1;
    if (application.status === "Applied") stats.newApps += 1;
    if (application.status === "Interview") stats.interviewing += 1;
    if (application.status === "Offer") stats.offers += 1;
    if (application.status === "Hired") stats.hired += 1;
    statsByJob.set(application.jobId, stats);
  });

  return jobs.map((job) => ({
    id: job.id,
    status: job.status,
    lifecycleStatus: job.lifecycleStatus || resolveJobLifecycle(job),
    createdAt: job.createdAt,
    startDate: job.startDate,
    deadline: job.deadline,
    viewCount: job.viewCount || 0,
    recruitmentRound: job.recruitmentRound || 1,
    position: job.position,
    category: job.category,
    branch: job.branch,
    jobLevel: job.jobLevel ? { id: job.jobLevel.id || job.jobLevel.name, name: job.jobLevel.name } : null,
    stats: statsByJob.get(job.id) || {
      total: 0,
      newApps: 0,
      interviewing: 0,
      offers: 0,
      hired: 0,
    },
  }));
}

function normalizeCampaigns(data: RecruiterCampaignSummaryDto[]): RecruiterCampaignItem[] {
  return data.map((campaign) => ({
    ...campaign,
    stats: {
      total: campaign.stats?.total || 0,
      newApps: campaign.stats?.newApplications || 0,
      interviewing: campaign.stats?.interviewing || 0,
      offers: campaign.stats?.offers || 0,
      hired: campaign.stats?.hired || 0,
    },
  }));
}

export function useJobCampaigns() {
  const [campaigns, setCampaigns] = useState<RecruiterCampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInFlightRef = useRef(false);
  const lastFetchedAtRef = useRef(0);

  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobCategoryFilter, setJobCategoryFilter] = useState<string | null>(null);
  const [jobStatusFilter, setJobStatusFilter] = useState<string | null>(null);
  const [jobBranchFilter, setJobBranchFilter] = useState<string | null>(null);
  const [jobLevelFilter, setJobLevelFilter] = useState<string | null>(null);
  const [jobPositionFilter, setJobPositionFilter] = useState<string | null>(null);
  const [jobRoundFilter, setJobRoundFilter] = useState<number | null>(null);
  const [jobCvFilter, setJobCvFilter] = useState<string | null>(null);
  const [jobDeadlineRange, setJobDeadlineRange] = useState<DateRange>(null);
  const [jobSortKey, setJobSortKey] = useState("newest");
  const [jobCurrentPage, setJobCurrentPage] = useState(1);

  const fetchData = useCallback(async (background = false) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    try {
      if (background) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const campaignData = asArray(await jobService.getMyCampaigns());
        setCampaigns(normalizeCampaigns(campaignData));
      } catch (campaignError: any) {
        const status = campaignError?.response?.status;
        if (status !== 404 && status !== 405) throw campaignError;

        // Tương thích tạm với backend chưa restart/deploy endpoint tóm tắt mới.
        const [applicationData, jobData] = await Promise.all([
          recruitmentService.getHrApplications(false),
          jobService.getMyJobs(),
        ]);
        setCampaigns(buildCampaignsFromLegacyData(asArray(jobData), asArray(applicationData)));
      }
      lastFetchedAtRef.current = Date.now();
    } catch (fetchError) {
      console.error(fetchError);
      setError("Không thể tải danh sách chiến dịch tuyển dụng. Vui lòng kiểm tra kết nối mạng và thử lại.");
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  useRealtimeResourceRefresh(["jobs", "applications"], () => fetchData(true));
  useRealtimeNotificationRefresh(
    () => fetchData(true),
    (detail: RealtimeNotificationEventDetail) =>
      Boolean(detail?.redirectUrl?.startsWith("/recruiter/applications")),
  );

  useEffect(() => {
    const refreshWhenReturning = () => {
      if (Date.now() - lastFetchedAtRef.current > 30_000) void fetchData(true);
    };
    window.addEventListener("focus", refreshWhenReturning);
    return () => window.removeEventListener("focus", refreshWhenReturning);
  }, [fetchData]);

  const uniqueValues = useCallback((selector: (job: RecruiterCampaignItem) => string | undefined) => {
    return Array.from(new Set(campaigns.map(selector).filter((value): value is string => Boolean(value))))
      .sort((left, right) => left.localeCompare(right, "vi"));
  }, [campaigns]);

  const jobCategories = useMemo(() => uniqueValues((job) => job.category?.name), [uniqueValues]);
  const jobBranches = useMemo(() => uniqueValues((job) => job.branch?.name), [uniqueValues]);
  const jobLevels = useMemo(() => uniqueValues((job) => job.jobLevel?.name), [uniqueValues]);
  const jobPositions = useMemo(() => uniqueValues((job) => job.position?.name), [uniqueValues]);
  const jobRounds = useMemo(
    () => Array.from(new Set(campaigns.map((job) => job.recruitmentRound || 1))).sort((a, b) => a - b),
    [campaigns],
  );

  const filteredAndSortedJobs = useMemo(() => {
    const query = removeVietnameseTones(jobSearchQuery.trim());
    const result = campaigns.filter((job) => {
      const searchableText = removeVietnameseTones([
        job.position?.name,
        job.category?.name,
        job.branch?.name,
        job.jobLevel?.name,
      ].filter(Boolean).join(" "));
      const matchesSearch = query === "" || searchableText.includes(query);
      const matchesCategory = !jobCategoryFilter || job.category?.name === jobCategoryFilter;
      const matchesStatus = !jobStatusFilter || job.lifecycleStatus === jobStatusFilter;
      const matchesBranch = !jobBranchFilter || job.branch?.name === jobBranchFilter;
      const matchesLevel = !jobLevelFilter || job.jobLevel?.name === jobLevelFilter;
      const matchesPosition = !jobPositionFilter || job.position?.name === jobPositionFilter;
      const matchesRound = !jobRoundFilter || job.recruitmentRound === jobRoundFilter;
      const matchesCvState = !jobCvFilter ||
        (jobCvFilter === "has-new" && job.stats.newApps > 0) ||
        (jobCvFilter === "has-applications" && job.stats.total > 0) ||
        (jobCvFilter === "no-applications" && job.stats.total === 0);
      const deadline = job.deadline ? dayjs(job.deadline) : null;
      const matchesDeadline = !jobDeadlineRange || !jobDeadlineRange[0] || !jobDeadlineRange[1] ||
        Boolean(deadline && !deadline.isBefore(jobDeadlineRange[0], "day") && !deadline.isAfter(jobDeadlineRange[1], "day"));

      return matchesSearch && matchesCategory && matchesStatus && matchesBranch && matchesLevel &&
        matchesPosition && matchesRound && matchesCvState && matchesDeadline;
    });

    return [...result].sort((left, right) => {
      if (jobSortKey === "new_cvs") return right.stats.newApps - left.stats.newApps;
      if (jobSortKey === "most_viewed") return right.viewCount - left.viewCount;
      if (jobSortKey === "most_applications") return right.stats.total - left.stats.total;
      if (jobSortKey === "deadline") return dayjs(left.deadline).valueOf() - dayjs(right.deadline).valueOf();
      if (jobSortKey === "title") return (left.position?.name || "").localeCompare(right.position?.name || "", "vi");
      const leftDate = dayjs(left.createdAt).valueOf();
      const rightDate = dayjs(right.createdAt).valueOf();
      return jobSortKey === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [
    campaigns,
    jobBranchFilter,
    jobCategoryFilter,
    jobCvFilter,
    jobDeadlineRange,
    jobLevelFilter,
    jobPositionFilter,
    jobRoundFilter,
    jobSearchQuery,
    jobSortKey,
    jobStatusFilter,
  ]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredAndSortedJobs.length / 6));
    if (jobCurrentPage > lastPage) setJobCurrentPage(lastPage);
  }, [filteredAndSortedJobs.length, jobCurrentPage]);

  const paginatedJobs = useMemo(() => {
    const start = (jobCurrentPage - 1) * 6;
    return filteredAndSortedJobs.slice(start, start + 6);
  }, [filteredAndSortedJobs, jobCurrentPage]);

  const handleResetJobFilters = () => {
    setJobSearchQuery("");
    setJobCategoryFilter(null);
    setJobStatusFilter(null);
    setJobBranchFilter(null);
    setJobLevelFilter(null);
    setJobPositionFilter(null);
    setJobRoundFilter(null);
    setJobCvFilter(null);
    setJobDeadlineRange(null);
    setJobSortKey("newest");
    setJobCurrentPage(1);
  };

  return {
    loading,
    refreshing,
    error,
    refetch: () => fetchData(false),
    jobSearchQuery,
    setJobSearchQuery,
    jobCategoryFilter,
    setJobCategoryFilter,
    jobStatusFilter,
    setJobStatusFilter,
    jobBranchFilter,
    setJobBranchFilter,
    jobLevelFilter,
    setJobLevelFilter,
    jobPositionFilter,
    setJobPositionFilter,
    jobRoundFilter,
    setJobRoundFilter,
    jobCvFilter,
    setJobCvFilter,
    jobDeadlineRange,
    setJobDeadlineRange,
    jobSortKey,
    setJobSortKey,
    jobCurrentPage,
    setJobCurrentPage,
    jobCategories,
    jobBranches,
    jobLevels,
    jobPositions,
    jobRounds,
    totalCampaigns: campaigns.length,
    filteredAndSortedJobs,
    paginatedJobs,
    handleResetJobFilters,
  };
}
