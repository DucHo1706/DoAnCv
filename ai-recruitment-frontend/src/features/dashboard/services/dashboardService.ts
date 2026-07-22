import axiosClient from "../../../services/axiosClient";

export interface JobOption {
  jobId: string;
  jobTitle: string;
  status?: string;
  createdAt?: string;
  deadline?: string;
  categoryName?: string;
}

export interface QuickMetrics {
  totalJobs: number;
  totalApplications: number;
  newApplications: number;
  averageFitScore: number;
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

  skillCloudData: [],
  fitScoreDistribution: [],
  topCandidates: [],

  degreeData: [],
  expData: [],
  experienceData: [],
  universityData: [],
};

const normalizeHrDashboardStats = (data: Partial<HrDashboardStats>): HrDashboardStats => {
  const quickMetrics: QuickMetrics = {
    totalJobs: data.quickMetrics?.totalJobs ?? data.totalJobs ?? 0,
    totalApplications: data.quickMetrics?.totalApplications ?? data.totalApplications ?? 0,
    newApplications: data.quickMetrics?.newApplications ?? data.newApplications ?? 0,
    averageFitScore: data.quickMetrics?.averageFitScore ?? data.averageFitScore ?? 0,
  };

  return {
    isSuccess: data.isSuccess ?? true,
    message: data.message ?? "",
    selectedJobId: data.selectedJobId ?? null,

    jobOptions: data.jobOptions ?? [],
    quickMetrics,

    totalJobs: data.totalJobs ?? quickMetrics.totalJobs,
    totalApplications: data.totalApplications ?? quickMetrics.totalApplications,
    newApplications: data.newApplications ?? quickMetrics.newApplications,
    averageFitScore: data.averageFitScore ?? quickMetrics.averageFitScore,

    skillCloudData: data.skillCloudData ?? [],
    fitScoreDistribution: data.fitScoreDistribution ?? [],
    topCandidates: data.topCandidates ?? [],

    degreeData: data.degreeData ?? [],
    expData: data.expData ?? data.experienceData ?? [],
    experienceData: data.experienceData ?? data.expData ?? [],
    universityData: data.universityData ?? [],
  };
};

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
};

export default dashboardService;
