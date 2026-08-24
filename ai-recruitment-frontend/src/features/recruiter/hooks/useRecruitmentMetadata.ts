import { useCallback, useEffect, useState } from "react";
import { jobService, type CategoryDto, type JobLevelDto, type JobPositionDto } from "../services/jobService";
import { useRealtimeResourceRefresh } from "../../../hooks/useRealtimeRefresh";

/** Metadata dùng chung cho bộ lọc HR và các form sourcing. */
export function useRecruitmentMetadata() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [positions, setPositions] = useState<JobPositionDto[]>([]);
  const [levels, setLevels] = useState<JobLevelDto[]>([]);

  const refreshMetadata = useCallback(async () => {
    const [categoryData, positionData, levelData] = await Promise.all([
      jobService.getCategories(),
      jobService.getJobPositions(),
      jobService.getJobLevels(),
    ]);
    setCategories((categoryData as any)?.$values || categoryData || []);
    setPositions((positionData as any)?.$values || positionData || []);
    setLevels((levelData as any)?.$values || levelData || []);
  }, []);

  useEffect(() => {
    void refreshMetadata().catch(() => {
      // Caller vẫn cho phép hiển thị giá trị cũ/nhập tay khi metadata tạm thời lỗi.
    });
  }, [refreshMetadata]);

  useRealtimeResourceRefresh(
    ["categories", "job-levels", "job-positions"],
    refreshMetadata,
  );

  return { categories, positions, levels };
}
