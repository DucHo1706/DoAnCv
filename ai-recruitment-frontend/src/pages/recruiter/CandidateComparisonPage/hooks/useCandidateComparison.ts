import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  candidateComparisonService,
  getCandidateComparisonErrorMessage,
  type CandidateComparisonResponse,
} from "../../../../services/candidateComparisonService";

type ComparisonQuery = {
  jobId: string;
  applicationIds: string[];
  errorMessage: string;
};

export function useCandidateComparison() {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("jobId") || "";
  const applicationIdsParam = searchParams.get("applicationIds") || "";
  const [comparisonData, setComparisonData] = useState<CandidateComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const query = useMemo<ComparisonQuery>(() => {
    const jobId = jobIdParam.trim();
    const applicationIds = applicationIdsParam
      .split(",")
      .map((applicationId) => applicationId.trim())
      .filter((applicationId) => applicationId.length > 0);

    if (jobId.length === 0) {
      return {
        jobId,
        applicationIds,
        errorMessage: "Đường dẫn so sánh thiếu jobId.",
      };
    }

    if (applicationIds.length < 2 || applicationIds.length > 4) {
      return {
        jobId,
        applicationIds,
        errorMessage: "Cần từ 2 đến 4 applicationIds để so sánh ứng viên.",
      };
    }

    const uniqueApplicationIds = new Set(
      applicationIds.map((applicationId) => applicationId.toLocaleLowerCase())
    );

    if (uniqueApplicationIds.size !== applicationIds.length) {
      return {
        jobId,
        applicationIds,
        errorMessage: "Danh sách applicationIds không được chứa ID trùng nhau.",
      };
    }

    return {
      jobId,
      applicationIds,
      errorMessage: "",
    };
  }, [applicationIdsParam, jobIdParam]);

  useEffect(() => {
    if (query.errorMessage.length > 0) {
      setComparisonData(null);
      setErrorMessage(query.errorMessage);
      setLoading(false);
      return;
    }

    let requestIsActive = true;

    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await candidateComparisonService.compareCandidates({
          jobId: query.jobId,
          applicationIds: query.applicationIds,
        });

        if (requestIsActive === true) {
          setComparisonData(response);
        }
      } catch (error: unknown) {
        if (requestIsActive === true) {
          setComparisonData(null);
          setErrorMessage(
            getCandidateComparisonErrorMessage(
              error,
              "Không thể tải dữ liệu so sánh ứng viên. Vui lòng kiểm tra lại đường dẫn hoặc quyền truy cập."
            )
          );
        }
      } finally {
        if (requestIsActive === true) {
          setLoading(false);
        }
      }
    };

    fetchComparisonData();

    return () => {
      requestIsActive = false;
    };
  }, [query]);

  return {
    comparisonData,
    loading,
    errorMessage,
  };
}
