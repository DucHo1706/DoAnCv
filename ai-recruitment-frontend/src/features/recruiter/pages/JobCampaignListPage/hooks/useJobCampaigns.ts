import { useState, useEffect, useMemo } from "react";
import { jobService } from "../../../../jobs/services/jobService";
import type { JobDto } from "../../../../jobs/services/jobService";
import { recruitmentService } from "../../../services/recruitmentService";
import type { ApplicationDto } from "../../../services/recruitmentService";
import { removeVietnameseTones } from "../../../../../utils/exportUtils";

export function useJobCampaigns() {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, filter, sort, pagination states
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobCategoryFilter, setJobCategoryFilter] = useState<string | null>(null);
  const [jobStatusFilter, setJobStatusFilter] = useState<string | null>(null);
  const [jobSortKey, setJobSortKey] = useState("newest");
  const [jobCurrentPage, setJobCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [appData, jobData] = await Promise.all([
        recruitmentService.getHrApplications(),
        jobService.getMyJobs(),
      ]);
      setApplications(Array.isArray(appData) ? appData : (appData as any)?.$values || []);
      setJobs(Array.isArray(jobData) ? jobData : (jobData as any)?.$values || []);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải danh sách chiến dịch tuyển dụng. Vui lòng kiểm tra kết nối mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute job statistics
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
        },
      };
    });
  }, [jobs, applications]);

  // Extract unique category names
  const jobCategories = useMemo(() => {
    const set = new Set<string>();
    jobsWithStats.forEach((job: any) => {
      if (job.category?.name) set.add(job.category.name);
    });
    return Array.from(set);
  }, [jobsWithStats]);

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let result = jobsWithStats.filter((job: any) => {
      const title = removeVietnameseTones(job.position?.name || "");
      const cat = removeVietnameseTones(job.category?.name || "");
      const branch = removeVietnameseTones(job.branch?.name || "");
      const query = removeVietnameseTones(jobSearchQuery);
      const matchesSearch =
        query === "" || title.includes(query) || cat.includes(query) || branch.includes(query);
      const matchesCategory = jobCategoryFilter ? job.category?.name === jobCategoryFilter : true;
      const matchesStatus = jobStatusFilter
        ? jobStatusFilter === "Published"
          ? job.isApproved
          : !job.isApproved
        : true;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    result = [...result].sort((a: any, b: any) => {
      if (jobSortKey === "new_cvs") {
        return (b.stats?.newApps || 0) - (a.stats?.newApps || 0);
      }
      if (jobSortKey === "most_viewed") {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (jobSortKey === "most_applications") {
        return (b.stats?.total || 0) - (a.stats?.total || 0);
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [jobsWithStats, jobSearchQuery, jobSortKey, jobCategoryFilter, jobStatusFilter]);

  // Paginated slice
  const paginatedJobs = useMemo(() => {
    const start = (jobCurrentPage - 1) * 6;
    return filteredAndSortedJobs.slice(start, start + 6);
  }, [filteredAndSortedJobs, jobCurrentPage]);

  const handleResetJobFilters = () => {
    setJobSearchQuery("");
    setJobCategoryFilter(null);
    setJobStatusFilter(null);
    setJobSortKey("newest");
    setJobCurrentPage(1);
  };

  return {
    loading,
    error,
    refetch: fetchData,
    jobSearchQuery,
    setJobSearchQuery,
    jobCategoryFilter,
    setJobCategoryFilter,
    jobStatusFilter,
    setJobStatusFilter,
    jobSortKey,
    setJobSortKey,
    jobCurrentPage,
    setJobCurrentPage,
    jobCategories,
    filteredAndSortedJobs,
    paginatedJobs,
    handleResetJobFilters,
  };
}
