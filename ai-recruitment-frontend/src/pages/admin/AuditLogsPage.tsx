import {
  Card,
  Table,
  Input,
  Tag,
  Typography,
  message,
} from "antd";
import { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";
import { userService } from "../../services/userService";
import { appTheme } from "../../constants/theme";

const { Text } = Typography;

function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await userService.getAuditLogs();
      const actualData = Array.isArray(data) ? data : data?.$values || [];
      setLogs(actualData);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải nhật ký hoạt động!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const searchKey = searchText.trim().toLowerCase();
    const emailMatch = (log.userEmail || "").toLowerCase().includes(searchKey);
    const actionMatch = (log.action || "").toLowerCase().includes(searchKey);
    const targetMatch = (log.target || "").toLowerCase().includes(searchKey);
    return searchKey.length === 0 || emailMatch || actionMatch || targetMatch;
  });

  const getActionTagColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("khóa") || act.includes("ban") || act.includes("ẩn")) {
      return { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" };
    }
    if (act.includes("mở") || act.includes("tạo") || act.includes("duyệt")) {
      return { color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0" };
    }
    if (act.includes("cập nhật") || act.includes("sửa")) {
      return { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" };
    }
    return { color: "#2563EB", bg: "#EFF6FF", border: "#DBEAFE" };
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (dateStr: string) => {
        const d = new Date(dateStr);
        return (
          <Text style={{ fontSize: "13px", color: "#64748B" }}>
            {d.toLocaleDateString("vi-VN")} {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        );
      },
    },
    {
      title: "Người thực hiện",
      dataIndex: "userEmail",
      key: "userEmail",
      width: 220,
      render: (email: string) => <Text strong style={{ color: "#334155" }}>{email}</Text>,
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 200,
      render: (action: string) => {
        const styles = getActionTagColor(action);
        return (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
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
      render: (target: string) => <Text style={{ color: "#0F172A" }}>{target}</Text>,
    },
    {
      title: "Địa chỉ IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 140,
      render: (ip: string) => <Text code style={{ fontSize: "12px" }}>{ip}</Text>,
    },
  ];

  return (
    <PageContainer
      title="Nhật ký hoạt động hệ thống"
      subtitle="Giám sát các thao tác nhạy cảm của các quản trị viên và nhà tuyển dụng trên hệ thống."
    >
      <Card
        style={{
          background: "#FFFFFF",
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
          borderRadius: 16,
        }}
        bodyStyle={{ padding: 24 }}
      >
        <TableToolbar
          searchPlaceholder="Tìm kiếm nhật ký theo email, hành động, đối tượng..."
          searchValue={searchText}
          onSearchChange={setSearchText}
        />

        <Table
          columns={columns}
          dataSource={filteredLogs.map((log, idx) => ({ ...log, key: log.auditLogID || idx }))}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "Không tìm thấy vết thao tác nào trên hệ thống." }}
          style={{ fontFamily: appTheme.font.family }}
        />
      </Card>
    </PageContainer>
  );
}

export default AuditLogsPage;
