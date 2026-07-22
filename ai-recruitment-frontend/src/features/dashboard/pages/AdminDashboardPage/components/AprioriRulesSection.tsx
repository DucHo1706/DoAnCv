import { useState, useEffect } from "react";
import { Card, Table, Button, Tag, Space, Typography, message, Tooltip } from "antd";
import { RobotOutlined, ReloadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import axiosClient from "../../../../../services/axiosClient";

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
      console.error("Lỗi lấy danh sách quy luật tương quan kỹ năng:", error);
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
      message.success(res.data?.message || "Cập nhật phân tích tương quan kỹ năng thành công!");
      fetchRules();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi cập nhật phân tích tương quan kỹ năng.");
    } finally {
      setTraining(false);
    }
  };

  const columns = [
    {
      title: "Quy luật Tương quan Kỹ năng",
      key: "rule",
      render: (_: any, record: any) => (
        <Space size={8}>
          <Text strong>Khi có kỹ năng:</Text>
          {record.antecedent.map((skill: string) => (
            <Tag color="blue" key={skill} style={{ fontSize: 13, padding: "2px 8px", borderRadius: 4 }}>
              {skill}
            </Tag>
          ))}
          <Text type="secondary" strong>→</Text>
          <Text strong style={{ color: "#16a34a" }}>Gợi ý kỹ năng đi kèm:</Text>
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
          Tỷ lệ Phổ biến (Support) {" "}
          <Tooltip title="Tỷ lệ phần trăm hồ sơ ứng viên sở hữu đồng thời tổ hợp kỹ năng này trên toàn hệ thống.">
            <InfoCircleOutlined style={{ fontSize: 12, color: "#64748B" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "support",
      key: "support",
      width: 200,
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
          Độ Tin cậy Phân tích (Confidence) {" "}
          <Tooltip title="Xác suất ứng viên sở hữu kỹ năng nền tảng cũng có kỹ năng bổ trợ đi kèm.">
            <InfoCircleOutlined style={{ fontSize: 12, color: "#64748B" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "confidence",
      key: "confidence",
      width: 220,
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
            Tương quan Kỹ năng & Gợi ý Bổ trợ
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
            Cập nhật Phân tích Tương quan
          </Button>
        </Space>
      }
    >
      <Paragraph style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
        Gợi ý kỹ năng thường đi kèm nhau dựa trên dữ liệu hồ sơ ứng viên thực tế.
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
