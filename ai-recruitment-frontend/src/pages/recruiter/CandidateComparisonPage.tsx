import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Button,
  Col,
  Row,
  Spin,
  Alert,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import { recruitmentService } from "../../services/recruitmentService";
import type { ApplicationDto } from "../../services/recruitmentService";
import { AiReportCard } from "../../components/ai-report/AiReportCard";



export default function CandidateComparisonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ApplicationDto[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const idsStr = searchParams.get("ids") || "";
  const jobId = searchParams.get("jobId") || "";
  const targetIds = idsStr.split(",").filter(Boolean);

  useEffect(() => {
    async function loadCandidates() {
      if (targetIds.length < 2 || targetIds.length > 3) {
        setErrorMsg("Vui lòng chọn từ 2 đến 3 ứng viên để so sánh.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allApplications = await recruitmentService.getHrApplications();
        const apps = Array.isArray(allApplications)
          ? allApplications
          : (allApplications as any)?.$values || [];

        const filtered = apps.filter((app: ApplicationDto) => targetIds.includes(app.id));
        setCandidates(filtered);
      } catch (err) {
        setErrorMsg("Không thể tải thông tin hồ sơ ứng viên để so sánh.");
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [idsStr]);

  const handleBack = () => {
    if (jobId) {
      navigate(`/recruiter/applications?jobId=${jobId}`);
    } else {
      navigate("/recruiter/applications");
    }
  };

  if (loading) {
    return (
      <PageContainer title="Đối sánh năng lực ứng viên" subtitle="Đang phân tích và tải kết quả so khớp trực diện...">
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Đang tải dữ liệu so sánh..." />
        </div>
      </PageContainer>
    );
  }

  if (errorMsg) {
    return (
      <PageContainer title="Đối sánh năng lực ứng viên" subtitle="Có lỗi xảy ra trong quá trình đối sánh.">
        <Alert
          message="Không thể đối sánh"
          description={errorMsg}
          type="warning"
          showIcon
          action={
            <Button type="primary" onClick={handleBack}>
              Quay lại trang quản lý ứng tuyển
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Đối sánh năng lực ứng viên"
      subtitle="Báo cáo so khớp chi tiết năng lực, kỹ năng và mức độ tương thích từ động cơ phân tích AI."
    >
      <div style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ borderRadius: 8 }}>
          Quay lại trang quản lý ứng tuyển
        </Button>
      </div>

      <Row gutter={[20, 20]} justify="center">
        {candidates.map((app) => (
          <Col key={app.id} xs={24} lg={candidates.length === 2 ? 12 : 8}>
            <AiReportCard
              candidateName={app.candidateName}
              email={app.email}
              phone={app.phone}
              aiScore={app.aiScore}
              classification={app.classification}
              aiReason={app.aiReason}
              matchedSkills={app.matchedSkills}
              missingSkills={app.missingSkills}
              criteriaResults={app.criteriaResults}
              showContactInfo={true}
              showCriteriaTable={true}
            />
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
}
