import { EyeOutlined, TrophyOutlined, UserOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Drawer,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import TableToolbar from "../../components/common/TableToolbar";
import { recruitmentService } from "../../services/recruitmentService";
import type { ApplicationDto, CriteriaResultDto } from "../../services/recruitmentService";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";

const { Paragraph, Text } = Typography;

function CVRankingPage() {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationDto | null>(null);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appData, jobData] = await Promise.all([
          recruitmentService.getHrApplications(),
          jobService.getMyJobs()
        ]);
        setApplications(Array.isArray(appData) ? appData : (appData as any)?.$values || []);
        setJobs(Array.isArray(jobData) ? jobData : (jobData as any)?.$values || []);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu xếp hạng");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rankingData = useMemo(() => {
    let filtered = applications;
    if (selectedJobId) {
      filtered = filtered.filter(a => a.jobId === selectedJobId);
    }
    return [...filtered]
      .sort((a, b) => b.aiScore - a.aiScore)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        key: item.id,
      }));
  }, [applications, selectedJobId]);

  const parseSkills = (jsonStr: string) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getCriterionName = (record: CriteriaResultDto) => {
    if (record.criterionName) {
      return record.criterionName;
    }

    if (record.criterion_name) {
      return record.criterion_name;
    }
    return "Chưa có tên tiêu chí";
  };

  const getCriterionMaxScore = (record: CriteriaResultDto) => {
    if (record.maxScore !== undefined && record.maxScore !== null) {
      return record.maxScore;
    }

    if (record.max_score !== undefined && record.max_score !== null) {
      return record.max_score;
    }
    return 0;
  };

  const getClassificationColor = (classification?: string) => {
  if (!classification) {
    return "default";
  }

  if (classification.includes("Phù hợp cao")) {
    return "green";
  }

  if (classification === "Phù hợp") {
    return "blue";
  }

  if (classification.includes("Nên xem xét")) {
    return "gold";
  }

  if (classification.includes("Chưa phù hợp")) {
    return "orange";
  }

  if (classification.includes("Không phù hợp")) {
    return "red";
  }

  return "default";
};

  const columns = [
    {
      title: "Hạng",
      dataIndex: "rank",
      key: "rank",
      render: (value: number) => (
        <Tag color={value <= 3 ? "gold" : "default"}>#{value}</Tag>
      ),
    },
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
    },
    {
      title: "Vị trí",
      dataIndex: "jobTitle",
      key: "jobTitle",
    },
    {
      title: "Điểm phù hợp",
      dataIndex: "aiScore",
      key: "aiScore",
      render: (value: number) => <Text strong>{value}/100</Text>,
    },
    {
      title: "Phân loại",
      dataIndex: "classification",
      key: "classification",
      render: (value: string | undefined) => (
        <Tag color={getClassificationColor(value)}>
          {value || "Chưa phân loại"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: ApplicationDto) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setSelectedCandidate(record)}>
            Xem nhanh AI
          </Button>
          <Button type="primary" icon={<UserOutlined />} onClick={() => navigate(`/recruiter/candidates/${record.id}`)}>
            Hồ sơ chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Xếp hạng CV"
      subtitle="Danh sách ứng viên được sắp xếp từ cao xuống thấp theo AI matching score."
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="Top 1 hiện tại" value={rankingData[0]?.candidateName || "-"} subtitle="Ứng viên dẫn đầu" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Điểm cao nhất" value={`${rankingData[0]?.aiScore || 0}/100`} subtitle="Best fit score" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Số lượng hồ sơ" value={rankingData.length} subtitle={selectedJobId ? "Của công việc này" : "Tất cả công việc"} icon={<TrophyOutlined />} />
        </Col>
      </Row>

      <Card>
        <TableToolbar
          searchPlaceholder="Tìm kiếm..."
          extra={
            <>
              <Select
                placeholder="Lọc theo tin tuyển dụng..."
                style={{ width: 300 }}
                allowClear
                value={selectedJobId}
                onChange={setSelectedJobId}
                options={jobs.map(j => ({
                  label: `${j.position?.name || 'Vị trí'} (${j.branch?.name || 'Chi nhánh'})`,
                  value: j.id
                }))}
              />
            </>
          }
        />

        <Table
          columns={columns}
          dataSource={rankingData}
          loading={loading}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      <Drawer
        title="Giải thích điểm chấm AI"
        placement="right"
        width={760}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      >
        {selectedCandidate ? (
          <>
            <Paragraph>
              <Text strong>Ứng viên:</Text> {selectedCandidate.candidateName}
            </Paragraph>
            <Paragraph>
              <Text strong>Vị trí:</Text> {selectedCandidate.jobTitle}
            </Paragraph>
            <Paragraph>
              <Text strong>Điểm phù hợp:</Text> <Text type={selectedCandidate.aiScore >= 75 ? "success" : "warning"} strong>{selectedCandidate.aiScore}/100</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Phân loại:</Text>{" "}
              <Tag color={getClassificationColor(selectedCandidate.classification)}>
                {selectedCandidate.classification || "Chưa phân loại"}
              </Tag>
            </Paragraph>
            <div style={{ marginTop: 16 }}>
              <Text strong>Tóm tắt của AI</Text>
              <Paragraph style={{ marginTop: 8, padding: 12, background: "#f5f5f5", borderRadius: 6 }}>
                {selectedCandidate.aiReason}
              </Paragraph>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <Text strong>Bảng điểm từng tiêu chí</Text>

              <Table
                style={{ marginTop: 8 }}
                size="small"
                pagination={false}
                rowKey={(record) => getCriterionName(record)}
                dataSource={selectedCandidate.criteriaResults || []}
                columns={[
                  {
                    title: "Tiêu chí",
                    key: "criterionName",
                    render: (_: unknown, record: CriteriaResultDto) => getCriterionName(record),
                  },
                  {
                    title: "Trọng số",
                    dataIndex: "weight",
                    key: "weight",
                    width: 90,
                    render: (value: number) => `${value}`,
                  },
                  {
                    title: "Điểm",
                    key: "score",
                    width: 90,
                    render: (_: unknown, record: CriteriaResultDto) => {
                      const maxScore = getCriterionMaxScore(record);
                      return `${record.score}/${maxScore}`;
                    },
                  },
                  {
                    title: "Nhận xét",
                    dataIndex: "comment",
                    key: "comment",
                  },
                ]}
                locale={{
                  emptyText: "Chưa có dữ liệu điểm theo tiêu chí",
                }}
              />
            </div>
                
            <div style={{ marginTop: 16 }}>
              <Text strong>Điểm mạnh (Kỹ năng khớp)</Text>
              <div style={{ marginTop: 8 }}>
                {parseSkills(selectedCandidate.matchedSkills).length > 0 ? (
                  parseSkills(selectedCandidate.matchedSkills).map((item) => (
                    <Tag color="success" key={item} style={{ marginBottom: 8 }}>{item}</Tag>
                  ))
                ) : (
                  <Text type="secondary">Không tìm thấy kỹ năng khớp</Text>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>Khoảng thiếu (Kỹ năng thiếu)</Text>
              <div style={{ marginTop: 8 }}>
                {parseSkills(selectedCandidate.missingSkills).length > 0 ? (
                  parseSkills(selectedCandidate.missingSkills).map((item) => (
                    <Tag color="error" key={item} style={{ marginBottom: 8 }}>{item}</Tag>
                  ))
                ) : (
                  <Text type="secondary">Đã đáp ứng đủ kỹ năng yêu cầu</Text>
                )}
              </div>
            </div>
          </>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

export default CVRankingPage;