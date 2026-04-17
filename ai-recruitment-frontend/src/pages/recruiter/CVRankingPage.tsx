import { EyeOutlined, TrophyOutlined } from "@ant-design/icons";
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
} from "antd";
import { useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import TableToolbar from "../../components/common/TableToolbar";
import { recruiterCandidates } from "../../mock/recruiter";
import type { RecruiterCandidate } from "../../mock/recruiter";

const { Paragraph, Text } = Typography;

function CVRankingPage() {
  const [selectedCandidate, setSelectedCandidate] =
    useState<RecruiterCandidate | null>(null);

  const rankingData = [...recruiterCandidates]
    .sort((a, b) => b.fitScore - a.fitScore)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      key: item.id,
    }));

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
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Điểm phù hợp",
      dataIndex: "fitScore",
      key: "fitScore",
      render: (value: number) => <Text strong>{value}/100</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: RecruiterCandidate) => (
        <Button icon={<EyeOutlined />} onClick={() => setSelectedCandidate(record)}>
          Xem giải thích
        </Button>
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
          <StatCard title="Top 1 hiện tại" value={rankingData[0]?.name || "-"} subtitle="Ứng viên dẫn đầu" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Điểm cao nhất" value={`${rankingData[0]?.fitScore || 0}/100`} subtitle="Best fit score" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Top 3 nổi bật" value={3} subtitle="Ưu tiên review trước" icon={<TrophyOutlined />} />
        </Col>
      </Row>

      <Card>
        <TableToolbar
          searchPlaceholder="Tìm theo tên ứng viên..."
          extra={
            <>
              <Select
                placeholder="Vị trí"
                style={{ width: 180 }}
                options={[
                  { label: "Frontend Developer", value: "frontend" },
                  { label: "Backend Developer", value: "backend" },
                  { label: "Business Analyst", value: "ba" },
                ]}
              />
              <Select
                placeholder="Khoảng điểm"
                style={{ width: 180 }}
                options={[
                  { label: "90 - 100", value: "90-100" },
                  { label: "80 - 89", value: "80-89" },
                  { label: "70 - 79", value: "70-79" },
                ]}
              />
            </>
          }
        />

        <Table
          columns={columns}
          dataSource={rankingData}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      <Drawer
        title="Giải thích điểm chấm AI"
        placement="right"
        width={460}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      >
        {selectedCandidate ? (
          <>
            <Paragraph>
              <Text strong>Ứng viên:</Text> {selectedCandidate.name}
            </Paragraph>
            <Paragraph>
              <Text strong>Vị trí:</Text> {selectedCandidate.position}
            </Paragraph>
            <Paragraph>
              <Text strong>Điểm phù hợp:</Text> {selectedCandidate.fitScore}/100
            </Paragraph>

            <div style={{ marginTop: 16 }}>
              <Text strong>Tóm tắt của AI</Text>
              <Paragraph style={{ marginTop: 8 }}>
                {selectedCandidate.aiSummary}
              </Paragraph>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>Điểm mạnh</Text>
              {selectedCandidate.strengths.map((item) => (
                <Paragraph key={item} style={{ marginBottom: 8 }}>
                  • {item}
                </Paragraph>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>Khoảng thiếu</Text>
              {selectedCandidate.gaps.map((item) => (
                <Paragraph key={item} style={{ marginBottom: 8 }}>
                  • {item}
                </Paragraph>
              ))}
            </div>
          </>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

export default CVRankingPage;