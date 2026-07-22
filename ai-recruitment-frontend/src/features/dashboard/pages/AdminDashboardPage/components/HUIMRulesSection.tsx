import { useState, useEffect } from "react";
import { Card, Table, Button, Tag, Space, Typography, message, Tooltip } from "antd";
import { ReloadOutlined, InfoCircleOutlined, DollarOutlined } from "@ant-design/icons";
import axiosClient from "../../../../../services/axiosClient";

const { Title, Paragraph, Text } = Typography;

export default function HUIMRulesSection() {
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [itemsets, setItemsets] = useState<any[]>([]);

  const fetchItemsets = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/HighUtility/itemsets");
      const dataArray = Array.isArray(res.data) ? res.data : res.data?.itemsets || [];
      setItemsets(dataArray);
    } catch (error) {
      console.error("Lỗi lấy danh sách bộ kỹ năng giá trị cao:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemsets();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await axiosClient.post("/HighUtility/train?minUtility=100");
      message.success(res.data?.message || "Cập nhật phân tích nhóm kỹ năng giá trị cao thành công!");
      fetchItemsets();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi cập nhật phân tích kỹ năng giá trị.");
    } finally {
      setTraining(false);
    }
  };

  const columns = [
    {
      title: "Bộ Kỹ năng Chiến lược (High-Value Skillset)",
      key: "itemset",
      render: (_: any, record: any) => (
        <Space size={8} wrap>
          {record.itemset.map((skill: string) => (
            <Tag color="gold" key={skill} style={{ fontSize: 13, padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>
              {skill}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: (
        <span>
          Tổng Giá trị Định giá (Utility Value) {" "}
          <Tooltip title="Tổng giá trị lợi ích tích lũy (Độ thạo kỹ năng của ứng viên × Mức lương yêu cầu trung bình của các vị trí tuyển dụng).">
            <InfoCircleOutlined style={{ fontSize: 12, color: "#64748B" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "utility",
      key: "utility",
      width: 240,
      sorter: (a: any, b: any) => a.utility - b.utility,
      render: (val: number) => (
        <Text strong style={{ color: "#d97706", fontSize: 14 }}>
          {val.toLocaleString()} triệu VNĐ
        </Text>
      ),
    },
    {
      title: (
        <span>
          Quy mô Ứng viên (Candidate Pool) {" "}
          <Tooltip title="Số lượng ứng viên trong ngân hàng dữ liệu sở hữu đồng thời toàn bộ bộ kỹ năng này.">
            <InfoCircleOutlined style={{ fontSize: 12, color: "#64748B" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "support_count",
      key: "support_count",
      width: 220,
      sorter: (a: any, b: any) => a.support_count - b.support_count,
      render: (val: number) => (
        <Text strong style={{ color: "#2563EB" }}>
          {val} ứng viên
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
        border: "1px solid #FEF3C7"
      }}
      title={
        <Space size={12}>
          <DollarOutlined style={{ color: "#d97706", fontSize: 22 }} />
          <Title level={4} style={{ margin: 0, fontSize: 18 }}>
            Phân tích Nhóm Kỹ năng Giá trị Cao
          </Title>
        </Space>
      }
      extra={
        <Space size={12}>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={fetchItemsets}
            disabled={loading || training}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            style={{ background: "#d97706", borderColor: "#d97706" }}
            loading={training}
            onClick={handleTrain}
          >
            Cập nhật Phân tích Giá trị
          </Button>
        </Space>
      }
    >
      <Paragraph style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
        Xác định bộ kỹ năng có giá trị cao trên thị trường dựa trên năng lực ứng viên và mức lương tuyển dụng.
      </Paragraph>

      <Table
        loading={loading}
        dataSource={itemsets}
        columns={columns}
        rowKey={(_, idx) => idx !== undefined ? idx.toString() : ""}
        pagination={{ pageSize: 5 }}
        bordered
      />
    </Card>
  );
}
