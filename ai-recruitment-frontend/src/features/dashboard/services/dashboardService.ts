import axiosClient from "../../../services/axiosClient";

export interface JobOption {
  jobId: string;
  jobTitle: string;
  status?: string;
  createdAt?: string;
  deadline?: string;
  categoryName?: string;
  unreadCount?: number;
}

export interface QuickMetrics {
  totalJobs: number;
  totalApplications: number;
  newApplications: number;
  averageFitScore: number;
  totalViews?: number;
  applicationRate?: number;
  avgTimeToHireDays?: number;
}

export interface FunnelData {
  applied: number;
  reviewing: number;
  interview: number;
  offer: number;
  rejected: number;
}

export interface ApplicationTrendItem {
  date: string;
  count: number;
}

export interface SkillCloudItem {
  text: string;
  value: number;
}

export interface FitScoreDistributionItem {
  range: string;
  count: number;
}

export interface TopCandidateItem {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  email: string;
  jobId: string;
  jobTitle: string;
  featuredSkill: string;
  fitScore: number;
  aiScore: number;
  classification: string;
}

export interface ChartDataItem {
  type: string;
  value: number;
}

export interface ExperienceDataItem {
  range: string;
  count: number;
}

export interface HrDashboardStats {
  isSuccess: boolean;
  message: string;
  selectedJobId?: string | null;

  jobOptions: JobOption[];
  quickMetrics: QuickMetrics;

  totalJobs: number;
  totalApplications: number;
  newApplications: number;
  averageFitScore: number;

  funnel?: FunnelData;
  applicationTrend?: ApplicationTrendItem[];
  upcomingInterviews?: any[];

  skillCloudData: SkillCloudItem[];
  fitScoreDistribution: FitScoreDistributionItem[];
  topCandidates: TopCandidateItem[];

  degreeData: ChartDataItem[];
  expData: ExperienceDataItem[];
  experienceData: ExperienceDataItem[];
  universityData: ChartDataItem[];
}

export interface HrDashboardStatsParams {
  jobId?: string | null;
  timeRange?: string | null;
}

const emptyQuickMetrics: QuickMetrics = {
  totalJobs: 0,
  totalApplications: 0,
  newApplications: 0,
  averageFitScore: 0,
  totalViews: 0,
  applicationRate: 0,
  avgTimeToHireDays: 0,
};

export const emptyHrDashboardStats: HrDashboardStats = {
  isSuccess: false,
  message: "",
  selectedJobId: null,

  jobOptions: [],
  quickMetrics: emptyQuickMetrics,

  totalJobs: 0,
  totalApplications: 0,
  newApplications: 0,
  averageFitScore: 0,

  funnel: { applied: 0, reviewing: 0, interview: 0, offer: 0, rejected: 0 },
  applicationTrend: [],
  upcomingInterviews: [],

  skillCloudData: [],
  fitScoreDistribution: [],
  topCandidates: [],

  degreeData: [],
  expData: [],
  experienceData: [],
  universityData: [],
};

const normalizeHrDashboardStats = (data: any): HrDashboardStats => {
  const quickMetrics: QuickMetrics = {
    totalJobs: data?.quickMetrics?.totalJobs ?? data?.totalJobs ?? 0,
    totalApplications: data?.quickMetrics?.totalApplications ?? data?.totalApplications ?? 0,
    newApplications: data?.quickMetrics?.newApplications ?? data?.newApplications ?? 0,
    averageFitScore: data?.quickMetrics?.averageFitScore ?? data?.averageFitScore ?? 0,
    totalViews: data?.quickMetrics?.totalViews ?? data?.totalViews ?? 0,
    applicationRate: data?.quickMetrics?.applicationRate ?? data?.applicationRate ?? 0,
    avgTimeToHireDays: data?.quickMetrics?.avgTimeToHireDays ?? data?.avgTimeToHireDays ?? 0,
  };

  return {
    isSuccess: data?.isSuccess ?? true,
    message: data?.message ?? "",
    selectedJobId: data?.selectedJobId ?? null,

    jobOptions: data?.jobOptions ?? [],
    quickMetrics,

    totalJobs: data?.totalJobs ?? quickMetrics.totalJobs,
    totalApplications: data?.totalApplications ?? quickMetrics.totalApplications,
    newApplications: data?.newApplications ?? quickMetrics.newApplications,
    averageFitScore: data?.averageFitScore ?? quickMetrics.averageFitScore,

    funnel: data?.funnel ?? { applied: 0, reviewing: 0, interview: 0, offer: 0, rejected: 0 },
    applicationTrend: data?.applicationTrend ?? [],
    upcomingInterviews: data?.upcomingInterviews ?? [],

    skillCloudData: data?.skillCloudData ?? [],
    fitScoreDistribution: data?.fitScoreDistribution ?? [],
    topCandidates: data?.topCandidates ?? [],

    degreeData: data?.degreeData ?? [],
    expData: data?.expData ?? data?.experienceData ?? [],
    experienceData: data?.experienceData ?? data?.expData ?? [],
    universityData: data?.universityData ?? [],
  };
};

export interface RecruiterPerformanceItem {
  recruiterId: string;
  accountId: string;
  fullName: string;
  email: string;
  phone: string;
  branches: string;
  totalJobs: number;
  publishedJobs: number;
  pendingJobs: number;
  rejectedJobs: number;
  closedJobs: number;
  totalApplications: number;
  totalInterviews: number;
  hiredCount: number;
  avgMatchScore: number;
}

export const dashboardService = {
  async getHrDashboardStats(params?: HrDashboardStatsParams): Promise<HrDashboardStats> {
    const requestParams: Record<string, string> = {};

    if (params?.jobId) {
      requestParams.jobId = params.jobId;
    }

    if (params?.timeRange) {
      requestParams.timeRange = params.timeRange;
    }

    const response = await axiosClient.get("/Dashboard/hr-stats", {
      params: requestParams,
    });

    return normalizeHrDashboardStats(response.data);
  },

  async getRecruiterPerformance(): Promise<RecruiterPerformanceItem[]> {
    const response = await axiosClient.get("/Dashboard/recruiter-performance");
    if (response.data?.isSuccess && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default dashboardService;
