import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { talentPoolService } from "../../../../services/talentPoolService";
import type { TalentPoolCandidateDto } from "../../../../services/talentPoolService";
import { jobService, type JobDto, type CategoryDto } from "../../../../services/jobService";

export function useTalentPool() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterMinScore, setFilterMinScore] = useState<number | null>(null);
  
  // Advanced filters
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  const [talentPoolCandidates, setTalentPoolCandidates] = useState<TalentPoolCandidateDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesData, jobsData, categoriesData] = await Promise.all([
        talentPoolService.getTalentPoolCandidates(),
        jobService.getMyJobs(),
        jobService.getCategories(),
      ]);
      setTalentPoolCandidates(candidatesData);
      setJobs(Array.isArray(jobsData) ? jobsData : (jobsData as any)?.$values || []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.$values || []);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể tải dữ liệu Ngân hàng Ứng viên.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parseSkills = (skillsData?: string | string[] | null): string[] => {
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

  const formatDate = (value?: string) => {
    if (!value) return "Chưa cập nhật";
    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) return "Chưa cập nhật";
    return dateValue.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredCandidates = useMemo(() => {
    let result = talentPoolCandidates;

    if (filterStatus === "ready") {
      result = result.filter((candidate) => !candidate.isInviteLocked);
    } else if (filterStatus === "locked") {
      result = result.filter((candidate) => candidate.isInviteLocked);
    }

    if (filterMinScore !== null) {
      result = result.filter((candidate) => candidate.highestAiScore >= filterMinScore);
    }

    // Category filter matching
    if (filterCategory) {
      result = result.filter((candidate) => {
        const title = (candidate.highestScoreJobTitle || "").toLowerCase();
        // Fallback to skill keyword matching if title doesn't match
        const skills = parseSkills(candidate.highlightSkillsJson).join(" ").toLowerCase();
        const categoryName = categories.find(c => c.id === filterCategory)?.name?.toLowerCase() || "";
        
        // Match if category name is in title or candidate has matching skills
        if (categoryName === "công nghệ thông tin" || categoryName === "it") {
          return title.includes("developer") || title.includes("lập trình") || title.includes("it") || title.includes("phần mềm") || skills.includes("javascript") || skills.includes("python") || skills.includes("java") || skills.includes("sql");
        }
        return title.includes(categoryName) || skills.includes(categoryName);
      });
    }

    // Level filter matching
    if (filterLevel) {
      result = result.filter((candidate) => {
        const title = (candidate.highestScoreJobTitle || "").toLowerCase();
        return title.includes(filterLevel.toLowerCase());
      });
    }

    // Position filter matching
    if (filterPosition) {
      const positionName = jobs.find(j => j.position?.id === filterPosition)?.position?.name?.toLowerCase();
      if (positionName) {
        result = result.filter((candidate) => {
          const title = (candidate.highestScoreJobTitle || "").toLowerCase();
          const skills = parseSkills(candidate.highlightSkillsJson).join(" ").toLowerCase();
          
          // Match if highest applied job matches or candidate has matching skills
          return title.includes(positionName) || skills.includes(positionName);
        });
      }
    }

    const keyword = searchText.trim().toLowerCase();
    if (keyword.length === 0) return result;

    return result.filter((candidate) => {
      const skills = parseSkills(candidate.highlightSkillsJson).join(" ");
      const searchableText = [
        candidate.fullName,
        candidate.email,
        candidate.phone,
        candidate.highestScoreJobTitle,
        candidate.currentAvailabilityStatus,
        skills,
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(keyword);
    });
  }, [searchText, talentPoolCandidates, filterStatus, filterMinScore, filterCategory, filterLevel, filterPosition, categories, jobs]);

  const readyCount = talentPoolCandidates.filter(
    (candidate) => candidate.isInviteLocked === false
  ).length;

  const lockedCount = talentPoolCandidates.filter(
    (candidate) => candidate.isInviteLocked === true
  ).length;

  const averageAiScore = useMemo(() => {
    if (talentPoolCandidates.length === 0) return 0;
    const total = talentPoolCandidates.reduce((sum, c) => sum + (c.highestAiScore || 0), 0);
    return Math.round(total / talentPoolCandidates.length);
  }, [talentPoolCandidates]);

  // Extract distinct levels from open jobs
  const jobLevels = useMemo(() => {
    const levels = new Set<string>();
    jobs.forEach((job) => {
      if (job.jobLevel?.name) {
        levels.add(job.jobLevel.name);
      }
    });
    return Array.from(levels);
  }, [jobs]);

  // Extract distinct positions from open jobs
  const jobPositions = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach((job) => {
      if (job.position?.id && job.position?.name) {
        map.set(job.position.id, job.position.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [jobs]);

  return {
    navigate,
    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    filterMinScore,
    setFilterMinScore,
    filterCategory,
    setFilterCategory,
    filterPosition,
    setFilterPosition,
    filterLevel,
    setFilterLevel,
    talentPoolCandidates,
    categories,
    jobPositions,
    jobLevels,
    loading,
    parseSkills,
    formatDate,
    filteredCandidates,
    readyCount,
    lockedCount,
    averageAiScore,
  };
}
