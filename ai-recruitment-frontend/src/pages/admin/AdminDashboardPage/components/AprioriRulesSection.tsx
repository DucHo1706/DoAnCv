import { useState, useEffect } from "react";
import { Card, Table, Button, Tag, Space, Typography, message, Tooltip } from "antd";
import { RobotOutlined, ReloadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import axiosClient from "../../../../services/axiosClient";

const { Title, Paragraph, Text } = Typography;

export default function AprioriRulesSection() {
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [rules, setRules] = useState<any[]>([]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/Apriori/rules");
      // C# API trả về trực tiếp mảng các luật hoặc đối tượng chứa mảng
      const rulesArray = Array.isArray(res.data) ? res.data : res.data?.rules || [];
      setRules(rulesArray);
    } catch (error) {
      console.error("Lỗi lấy danh sách luật Apriori:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await axiosClient.post("/Apriori/train");
      message.success(res.data?.message || "Huấn luyện mô hình Apriori thành công!");
      fetchRules();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi huấn luyện mô hình Apriori.");
    } finally {
      setTraining(false);
    }
  };

  const columns = [
    {
      title: "Luật kết hợp kỹ năng (Rule)",
      key: "rule",
      render: (_: any, record: any) => (
        <Space size={8}>
          <Text strong>Nếu có kỹ năng:</Text>
          {record.antecedent.map((skill: string) => (
            <Tag color="blue" key={skill} style={{ fontSize: 13, padding: "2px 8px", borderRadius: 4 }}>
              {skill}
            </Tag>
          ))}
          <Text type="secondary" strong>→</Text>
          <Text strong style={{ color: "#16a34a" }}>Gợi ý học thêm:</Text>
          {record.consequent.map((skill: string) => (
            <Tag color="success" key={skill} style={{ fontSize: 13, padding: "2px 8px", borderRadius: 4 }}>
              {skill}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: (
        <span>
          Độ hỗ trợ (Support) {" "}
          <Tooltip title="Tần suất xuất hiện đồng thời của tổ hợp kỹ năng này trong toàn bộ cơ sở dữ liệu CV.">
            <InfoCircleOutlined style={{ fontSize: 12, color: "#64748B" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "support",
      key: "support",
      width: 180,
      sorter: (a: any, b: any) => a.support - b.support,
      render: (val: number) => (
        <Text strong style={{ color: "#475569" }}>
          {(val * 100).toFixed(1)}%
        </Text>
      ),
    },
    {
      title: (
        <span>
          Độ tin cậy (Confidence) {" "}
          <Tooltip title="Xác suất ứng viên có kỹ năng vế trái cũng sẽ có kỹ năng vế phải.">
            <InfoCircleOutlined style={{ fontSize: 12, color: "#64748B" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "confidence",
      key: "confidence",
      width: 200,
      sorter: (a: any, b: any) => a.confidence - b.confidence,
      render: (val: number) => (
        <Text strong style={{ color: "#2563EB" }}>
          {(val * 100).toFixed(1)}%
        </Text>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        marginTop: 24,
      }}
      title={
        <Space size={12}>
          <RobotOutlined style={{ color: "#722ed1", fontSize: 22 }} />
          <Title level={4} style={{ margin: 0, fontSize: 18 }}>
            Khai phá tri thức & Luật kết hợp kỹ năng (Thuật toán Apriori)
          </Title>
        </Space>
      }
      extra={
        <Space size={12}>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={fetchRules}
            disabled={loading || training}
          >
            Làm mới danh sách
          </Button>
          <Button
            type="primary"
            style={{ background: "#722ed1", borderColor: "#722ed1" }}
            loading={training}
            onClick={handleTrain}
          >
            Chạy Khai Phá Luật (Apriori)
          </Button>
        </Space>
      }
    >
      <Paragraph style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
        Mô-đun học máy không giám sát chạy thuật toán **Apriori** trên toàn bộ Ngân hàng ứng viên. Hệ thống tự động phát hiện mối liên quan mật thiết giữa các kỹ năng trong CV để đề xuất kỹ năng bổ sung cho ứng viên khi tạo hồ sơ và giúp nhà tuyển dụng hoàn thiện tiêu chí tìm kiếm nhân sự.
      </Paragraph>

      <Table
        loading={loading}
        dataSource={rules}
        columns={columns}
        rowKey={(_, idx) => idx !== undefined ? idx.toString() : ""}
        pagination={{ pageSize: 5 }}
        bordered
      />
    </Card>
  );
}
