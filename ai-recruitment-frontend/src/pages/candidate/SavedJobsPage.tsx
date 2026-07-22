import { Card, Table, Tag, Space, Button, message, Typography, Popconfirm, Empty, Spin } from "antd";
import { StarFilled, EnvironmentOutlined, DollarOutlined, ClockCircleOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../services/axiosClient";

const { Title, Paragraph, Text } = Typography;

interface SavedJobItem {
  id: string;
  description: string;
  salaryRange: string;
  createdAt: string;
  deadline: string;
  position?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  savedAt: string;
}

function SavedJobsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/jobs/saved");
      if (Array.isArray(response.data)) {
        setSavedJobs(response.data);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh sách việc làm đã lưu:", err);
      message.error("Không thể tải danh sách việc làm đã lưu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = async (jobId: string) => {
    try {
      await axiosClient.delete(`/jobs/${jobId}/unsave`);
      message.success("Đã xóa việc làm khỏi danh sách yêu thích.");
      setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (err) {
      console.error("Lỗi khi hủy lưu việc làm:", err);
      message.error("Lỗi khi thực hiện thao tác.");
    }
  };

  const columns = [
    {
      title: "Vị trí tuyển dụng",
      key: "position",
      render: (record: SavedJobItem) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ color: "#0F172A", fontSize: 14 }}>
            {record.position?.name || "Vị trí chưa cập nhật"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 2 }}>
            Công Ty AI Recruitment
          </Text>
        </div>
      )
    },
    {
      title: "Địa điểm",
      key: "location",
      render: (record: SavedJobItem) => (
        <Space style={{ color: "#475569", fontSize: 13 }}>
          <EnvironmentOutlined style={{ color: "#64748B" }} />
          <span>{record.branch?.name || "Chưa cập nhật"}</span>
        </Space>
      )
    },
    {
      title: "Mức lương",
      key: "salary",
      render: (record: SavedJobItem) => (
        <Space style={{ color: "#10B981", fontWeight: 600, fontSize: 13 }}>
          <DollarOutlined />
          <span>{record.salaryRange}</span>
        </Space>
      )
    },
    {
      title: "Hạn nộp hồ sơ",
      key: "deadline",
      render: (record: SavedJobItem) => {
        const deadlineDate = new Date(record.deadline);
        const isExpired = deadlineDate < new Date();
        return (
          <Space style={{ color: isExpired ? "#EF4444" : "#475569", fontSize: 13 }}>
            <ClockCircleOutlined />
            <span>
              {deadlineDate.toLocaleDateString("vi-VN")}
              {isExpired && <Tag color="error" style={{ marginLeft: 6 }}>Hết hạn</Tag>}
            </span>
          </Space>
        );
      }
    },
    {
      title: "Hành động",
      key: "action",
      align: "right" as const,
      render: (record: SavedJobItem) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#2563EB" }} />}
            onClick={() => navigate(`/jobs/${record.id}`)}
          >
            Xem tin
          </Button>
          <Popconfirm
            title="Bỏ lưu việc làm này?"
            description="Bạn chắc chắn muốn bỏ việc làm này khỏi danh sách đã lưu?"
            onConfirm={() => handleUnsave(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
            placement="topRight"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <Spin tip="Đang tải danh sách..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <StarFilled style={{ fontSize: 22, color: "#F59E0B" }} />
        <div>
          <Title level={3} style={{ margin: 0, color: "#0F172A" }}>Việc làm đã lưu</Title>
          <Paragraph type="secondary" style={{ fontSize: 14, margin: 0, marginTop: 4 }}>
            Danh sách các công việc bạn đã lưu để xem xét hoặc ứng tuyển sau này.
          </Paragraph>
        </div>
      </div>

      {savedJobs.length === 0 ? (
        <Card style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}>
          <Empty
            description="Bạn chưa lưu tin tuyển dụng nào."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate("/jobs")} style={{ background: "#2563EB", borderColor: "#2563EB" }}>
              Khám phá việc làm ngay
            </Button>
          </Empty>
        </Card>
      ) : (
        <Card
          bordered={false}
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={savedJobs}
            rowKey="id"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            style={{ borderRadius: "16px", overflow: "hidden" }}
          />
        </Card>
      )}
    </div>
  );
}

export default SavedJobsPage;
