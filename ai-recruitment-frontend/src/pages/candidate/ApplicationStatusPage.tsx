import { RobotOutlined } from "@ant-design/icons";
import { Card, Typography, Table, Tag, message } from "antd";
import { useEffect, useState } from "react";
import { recruitmentService } from "../../services/recruitmentService";
import PageContainer from "../../components/common/PageContainer";

const { Text } = Typography;

function ApplicationStatusPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        setLoading(true);

        const data: any = await recruitmentService.getMyApplications();

        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications(data?.$values || []);
        }
      } catch (error) {
        message.error("Không tải được lịch sử ứng tuyển.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyApps();
  }, []);

  const columns = [
    {
      title: "Vị trí ứng tuyển",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Điểm AI Đánh giá",
      dataIndex: "aiScore",
      key: "aiScore",
      render: (score: number) => {
        let color = "success";

        if (score < 50) {
          color = "error";
        } else if (score < 75) {
          color = "warning";
        }

        return (
          <Tag color={color} style={{ fontSize: "14px", padding: "4px 8px" }}>
            <RobotOutlined style={{ marginRight: 4 }} />
            {score}/100
          </Tag>
        );
      },
    },
    {
      title: "Nhận xét của AI",
      dataIndex: "aiReason",
      key: "aiReason",
      render: (text: string) => (
        <Text
          type="secondary"
          ellipsis={{ tooltip: text }}
          style={{ maxWidth: 350 }}
        >
          {text || "Chưa có nhận xét"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: () => <Tag color="blue">Đã gửi tới HR</Tag>,
    },
  ];

  return (
    <PageContainer
      title="Lịch sử Ứng tuyển"
      subtitle="Theo dõi các công việc bạn đã nộp CV và xem lại đánh giá chi tiết từ AI."
    >
      <Card>
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "Bạn chưa nộp CV vào vị trí nào." }}
        />
      </Card>
    </PageContainer>
  );
}

export default ApplicationStatusPage;