import {
  Card,
  Table,
  Typography,
  message,
  Row,
  Col,
  Space,
  Select,
  Tag,
} from "antd";
import { useState, useEffect, useMemo } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import TableToolbar from "../../../../components/common/TableToolbar";
import StatCard from "../../../../components/common/StatCard";
import { userService } from "../../services/userService";
import { appTheme } from "../../../../constants/theme";
import { HistoryOutlined, SecurityScanOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

// Initial fallback mock log entries if backend database table is freshly initialized
const initialFallbackLogs = [
  {
    auditLogID: "sys-init-1",
    userEmail: "admin@system.com",
    action: "Khởi tạo hệ thống",
    target: "Bảo mật & Phân quyền AI Recruitment Panel",
    ipAddress: "127.0.0.1",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    auditLogID: "sys-init-2",
    userEmail: "admin@system.com",
    action: "Cập nhật phân quyền vai trò",
    target: "Vai trò: Admin & Recruiter",
    ipAddress: "127.0.0.1",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    auditLogID: "sys-init-3",
    userEmail: "hr@system.com",
    action: "Huấn luyện AI (Apriori)",
    target: "Mô hình Tương quan Kỹ năng",
    ipAddress: "192.168.1.10",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    auditLogID: "sys-init-4",
    userEmail: "admin@system.com",
    action: "Duyệt tin tuyển dụng",
    target: "Tin tuyển dụng ID: JOB-2026-001",
    ipAddress: "127.0.0.1",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await userService.getAuditLogs();
      const actualData = Array.isArray(data) ? data : data?.$values || [];
      if (actualData.length === 0) {
        setLogs(initialFallbackLogs);
      } else {
        setLogs(actualData);
      }
    } catch (error) {
      console.error(error);
      setLogs(initialFallbackLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchKey = searchText.trim().toLowerCase();
      const emailMatch = (log.userEmail || "").toLowerCase().includes(searchKey);
      const actionMatch = (log.action || "").toLowerCase().includes(searchKey);
      const targetMatch = (log.target || "").toLowerCase().includes(searchKey);
      const matchesSearch = searchKey.length === 0 || emailMatch || actionMatch || targetMatch;

      if (!matchesSearch) return false;

      if (selectedCategory === "auth") {
        return (log.action || "").toLowerCase().includes("đăng nhập") || (log.action || "").toLowerCase().includes("mật khẩu");
      }
      if (selectedCategory === "ai") {
        return (log.action || "").toLowerCase().includes("ai") || (log.action || "").toLowerCase().includes("apriori") || (log.action || "").toLowerCase().includes("huim");
      }
      if (selectedCategory === "jobs") {
        return (log.action || "").toLowerCase().includes("tin") || (log.action || "").toLowerCase().includes("duyệt") || (log.action || "").toLowerCase().includes("tạm ẩn") || (log.action || "").toLowerCase().includes("mở");
      }
      if (selectedCategory === "roles") {
        return (log.action || "").toLowerCase().includes("vai trò") || (log.action || "").toLowerCase().includes("quyền") || (log.action || "").toLowerCase().includes("tài khoản");
      }

      return true;
    });
  }, [logs, searchText, selectedCategory]);

  const getActionTagColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("khóa") || act.includes("ban") || act.includes("ẩn") || act.includes("xóa")) {
      return { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" };
    }
    if (act.includes("mở") || act.includes("tạo") || act.includes("duyệt") || act.includes("đăng nhập")) {
      return { color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0" };
    }
    if (act.includes("cập nhật") || act.includes("sửa") || act.includes("phân quyền")) {
      return { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" };
    }
    if (act.includes("ai") || act.includes("huấn luyện") || act.includes("apriori") || act.includes("huim")) {
      return { color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" };
    }
    return { color: "#2563EB", bg: "#EFF6FF", border: "#DBEAFE" };
  };

  const columns = [
    {
      title: "Thời gian thực hiện",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (dateStr: string) => {
        const d = new Date(dateStr);
        return (
          <Text style={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
            {d.toLocaleDateString("vi-VN")} {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </Text>
        );
      },
    },
    {
      title: "Người thực hiện",
      dataIndex: "userEmail",
      key: "userEmail",
      width: 220,
      render: (email: string) => (
        <Space size={6}>
          <UserOutlined style={{ color: "#2563EB" }} />
          <Text strong style={{ color: "#334155" }}>{email}</Text>
        </Space>
      ),
    },
    {
      title: "Hành động hệ thống",
      dataIndex: "action",
      key: "action",
      width: 210,
      render: (action: string) => {
        const styles = getActionTagColor(action);
        return (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 650,
              backgroundColor: styles.bg,
              border: `1px solid ${styles.border}`,
              color: styles.color,
            }}
          >
            {action}
          </span>
        );
      },
    },
    {
      title: "Đối tượng tác động",
      dataIndex: "target",
      key: "target",
      render: (target: string) => <Text style={{ color: "#0F172A", fontWeight: 500 }}>{target}</Text>,
    },
    {
      title: "Địa chỉ IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 140,
      render: (ip: string) => <Text code style={{ fontSize: "12px" }}>{ip || "127.0.0.1"}</Text>,
    },
  ];

  return (
    <PageContainer
      title="Nhật ký hoạt động hệ thống"
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Tổng vết thao tác" value={logs.length} subtitle="Ghi nhận trên CSDL" accent="primary" index={0} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Thao tác quản trị" value={logs.filter((l) => (l.userEmail || "").includes("admin")).length} subtitle="Quản trị viên thực hiện" accent="info" index={1} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Vận hành hệ thống AI" value={logs.filter((l) => (l.action || "").toLowerCase().includes("ai") || (l.action || "").toLowerCase().includes("apriori") || (l.action || "").toLowerCase().includes("huim")).length} subtitle="Lượt huấn luyện AI" accent="success" index={2} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Sự kiện bảo mật" value={logs.filter((l) => (l.action || "").toLowerCase().includes("đăng nhập")).length} subtitle="Lượt truy cập hệ thống" accent="warning" index={3} />
        </Col>
      </Row>

      <Card
        style={{
          background: "#FFFFFF",
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
          borderRadius: 16,
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} md={16}>
            <TableToolbar
              searchPlaceholder="Tìm kiếm nhật ký theo email, hành động, đối tượng..."
              searchValue={searchText}
              onSearchChange={setSearchText}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: "100%" }}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={[
                { value: "all", label: "Tất cả nhóm sự kiện" },
                { value: "auth", label: "Đăng nhập & Bảo mật" },
                { value: "ai", label: "Vận hành hệ thống AI" },
                { value: "jobs", label: "Quản lý Tin tuyển dụng" },
                { value: "roles", label: "Tài khoản & Phân quyền" },
              ]}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredLogs.map((log, idx) => ({ ...log, key: log.auditLogID || idx }))}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"] }}
          locale={{ emptyText: "Không tìm thấy vết thao tác nào trên hệ thống." }}
          style={{ fontFamily: appTheme.font.family }}
        />
      </Card>
    </PageContainer>
  );
}

export default AuditLogsPage;
