import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { talentPoolService } from "../../../../services/talentPoolService";
import type { TalentPoolCandidateDto } from "../../../../services/talentPoolService";

export function useTalentPool() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [talentPoolCandidates, setTalentPoolCandidates] = useState<TalentPoolCandidateDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTalentPoolCandidates = async () => {
    try {
      setLoading(true);
      const data = await talentPoolService.getTalentPoolCandidates();
      setTalentPoolCandidates(data);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể tải danh sách Ngân hàng Ứng viên.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalentPoolCandidates();
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
  }, [searchText, talentPoolCandidates, filterStatus]);

  const readyCount = talentPoolCandidates.filter(
    (candidate) => candidate.isInviteLocked === false
  ).length;

  const lockedCount = talentPoolCandidates.filter(
    (candidate) => candidate.isInviteLocked === true
  ).length;

  return {
    navigate,
    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    talentPoolCandidates,
    loading,
    parseSkills,
    formatDate,
    filteredCandidates,
    readyCount,
    lockedCount,
  };
}
