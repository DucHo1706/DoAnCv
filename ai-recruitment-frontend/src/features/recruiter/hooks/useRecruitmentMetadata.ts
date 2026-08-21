import { useEffect, useState } from "react";
import { jobService, type CategoryDto, type JobLevelDto, type JobPositionDto } from "../services/jobService";

/** Metadata dùng chung cho bộ lọc HR và các form sourcing. */
export function useRecruitmentMetadata() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [positions, setPositions] = useState<JobPositionDto[]>([]);
  const [levels, setLevels] = useState<JobLevelDto[]>([]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      jobService.getCategories(),
      jobService.getJobPositions(),
      jobService.getJobLevels(),
    ]).then(([categoryData, positionData, levelData]) => {
      if (!mounted) return;
      setCategories((categoryData as any)?.$values || categoryData || []);
      setPositions((positionData as any)?.$values || positionData || []);
      setLevels((levelData as any)?.$values || levelData || []);
    }).catch(() => {
      // Caller vẫn cho phép hiển thị giá trị cũ/nhập tay khi metadata tạm thời lỗi.
    });
    return () => { mounted = false; };
  }, []);

  return { categories, positions, levels };
}
