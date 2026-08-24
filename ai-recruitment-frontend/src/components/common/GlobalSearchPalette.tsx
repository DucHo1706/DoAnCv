import { Modal, Input, Empty, Tag, Typography } from "antd";
import {
  SearchOutlined,
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  FileSearchOutlined,
  ArrowRightOutlined,
  UserOutlined,
  SettingOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appTheme } from "../../constants/theme";
import { userService } from "../../features/admin-settings/services/userService";
import { jobService } from "../../features/jobs/services/jobService";

const { Text } = Typography;

type ResultItem = {
  id: string;
  group: "Điều hướng" | "Người dùng" | "Tin tuyển dụng" | "Chi nhánh & Lĩnh vực";
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  path: string;
  keywords: string;
};

const NAV_ITEMS: ResultItem[] = [
  {
    id: "nav-dashboard",
    group: "Điều hướng",
    icon: <DashboardOutlined />,
    title: "Thống kê & Phân tích",
    subtitle: "Tổng quan Dashboard quản trị",
    path: "/admin/dashboard",
    keywords: "dashboard thống kê phân tích báo cáo",
  },
  {
    id: "nav-approval",
    group: "Điều hướng",
    icon: <FileTextOutlined />,
    title: "Duyệt tin tuyển dụng",
    subtitle: "Quản lý & phê duyệt Job posting",
    path: "/admin/approval",
    keywords: "duyệt tin tuyển dụng job approval pending",
  },
  {
    id: "nav-users",
    group: "Điều hướng",
    icon: <TeamOutlined />,
    title: "Người dùng & Phân quyền",
    subtitle: "Quản lý tài khoản hệ thống",
    path: "/admin/users",
    keywords: "người dùng user account quản lý tài khoản",
  },
  {
    id: "nav-roles",
    group: "Điều hướng",
    icon: <SafetyCertificateOutlined />,
    title: "Vai trò & Quyền truy cập",
    subtitle: "Cấu hình phân quyền hệ thống",
    path: "/admin/roles",
    keywords: "vai trò quyền role permission phân quyền",
  },
  {
    id: "nav-branches",
    group: "Điều hướng",
    icon: <BranchesOutlined />,
    title: "Chi nhánh",
    subtitle: "Cơ cấu tổ chức",
    path: "/admin/branches",
    keywords: "chi nhánh branch địa điểm",
  },
  {
    id: "nav-categories",
    group: "Điều hướng",
    icon: <AppstoreOutlined />,
    title: "Lĩnh vực ngành nghề",
    subtitle: "Cơ cấu tổ chức",
    path: "/admin/categories",
    keywords: "lĩnh vực ngành nghề category",
  },
  {
    id: "nav-job-levels",
    group: "Điều hướng",
    icon: <ApartmentOutlined />,
    title: "Cấp bậc công việc",
    subtitle: "Cơ cấu tổ chức",
    path: "/admin/job-levels",
    keywords: "cấp bậc job level",
  },
  {
    id: "nav-job-positions",
    group: "Điều hướng",
    icon: <ApartmentOutlined />,
    title: "Vị trí công việc",
    subtitle: "Cơ cấu tổ chức",
    path: "/admin/job-positions",
    keywords: "vị trí công việc position",
  },
  {
    id: "nav-recruiter-performance",
    group: "Điều hướng",
    icon: <TrophyOutlined />,
    title: "Hiệu suất Recruiter",
    subtitle: "Đối sánh năng lực Chuyên viên Tuyển dụng",
    path: "/admin/recruiter-performance",
    keywords: "hiệu suất recruiter hr báo cáo đối sánh năng lực",
  },
  {
    id: "nav-audit-logs",
    group: "Điều hướng",
    icon: <FileSearchOutlined />,
    title: "Nhật ký bảo mật",
    subtitle: "Audit logs hệ thống",
    path: "/admin/audit-logs",
    keywords: "nhật ký bảo mật audit log lịch sử",
  },
  {
    id: "nav-settings",
    group: "Điều hướng",
    icon: <SettingOutlined />,
    title: "Cài đặt hệ thống",
    subtitle: "Cấu hình AI, OCR, thời hạn tin tuyển dụng",
    path: "/admin/settings",
    keywords: "cài đặt hệ thống settings cấu hình ai ocr",
  },
];

function normalize(text: string) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = normalize(text).indexOf(normalize(query));
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(37, 99, 235, 0.16)", color: appTheme.colors.primary, borderRadius: 8, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface GlobalSearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

function GlobalSearchPalette({ open, onClose }: GlobalSearchPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [users, setUsers] = useState<ResultItem[]>([]);
  const [jobs, setJobs] = useState<ResultItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const inputRef = useRef<any>(null);

  // Lazy-load searchable entities once when the palette is first opened
  useEffect(() => {
    if (!open || dataLoaded) return;

    (async () => {
      try {
        const [userData, jobData]: [any, any] = await Promise.all([
          userService.getUsers().catch(() => []),
          jobService.getAdminJobs().catch(() => []),
        ]);

        const userList = Array.isArray(userData) ? userData : userData?.$values || [];
        const jobList = Array.isArray(jobData) ? jobData : jobData?.$values || [];

        setUsers(
          userList.map((u: any) => ({
            id: `user-${u.id}`,
            group: "Người dùng" as const,
            icon: <UserOutlined />,
            title: u.fullName || u.email || "Chưa cập nhật",
            subtitle: `${u.email || ""} · ${u.role === "Admin" ? "Quản trị viên" : u.role === "Recruiter" ? "Nhà tuyển dụng" : "Ứng viên"}`,
            path: "/admin/users",
            keywords: `${u.fullName || ""} ${u.email || ""} ${u.role || ""}`,
          }))
        );

        setJobs(
          jobList.map((j: any) => ({
            id: `job-${j.id}`,
            group: "Tin tuyển dụng" as const,
            icon: <FileTextOutlined />,
            title: j.position?.name || "Vị trí chưa cập nhật",
            subtitle: `${j.recruiter?.name || "HR"} · ${j.status === "Pending" ? "Chờ duyệt" : j.status === "Published" ? "Đang chạy" : j.status === "Rejected" ? "Đã từ chối" : "Đã đóng"}`,
            path: "/admin/approval",
            keywords: `${j.position?.name || ""} ${j.recruiter?.name || ""} ${j.branch?.name || ""}`,
          }))
        );

        setDataLoaded(true);
      } catch {
        setDataLoaded(true);
      }
    })();
  }, [open, dataLoaded]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const results = useMemo(() => {
    const all = [...NAV_ITEMS, ...users, ...jobs];
    const q = normalize(query);
    if (!q) return NAV_ITEMS.slice(0, 8);
    return all.filter((item) => normalize(item.keywords).includes(q) || normalize(item.title).includes(q)).slice(0, 30);
  }, [query, users, jobs]);

  const grouped = useMemo(() => {
    const groups: Record<string, ResultItem[]> = {};
    results.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [results]);

  const handleSelect = useCallback(
    (item: ResultItem) => {
      navigate(item.path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) handleSelect(item);
    }
  };

  let flatIndex = -1;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={640}
      styles={{
        body: { padding: 0 },
      }}
      style={{ top: 96 }}
      className="global-search-modal"
      destroyOnClose
    >
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${appTheme.colors.border}` }}>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Tìm trang, người dùng, tin tuyển dụng..."
          prefix={<SearchOutlined style={{ color: appTheme.colors.textSecondary, fontSize: 16 }} />}
          suffix={
            <Tag style={{ margin: 0, borderRadius: 8, fontSize: 11, color: appTheme.colors.textSecondary, background: appTheme.colors.background }}>
              Esc
            </Tag>
          }
          variant="borderless"
          style={{ fontSize: 16 }}
          autoFocus
        />
      </div>

      <div style={{ maxHeight: 420, overflowY: "auto", padding: "8px 0" }}>
        {results.length === 0 ? (
          <div style={{ padding: "40px 20px" }}>
            <Empty description={`Không tìm thấy kết quả cho "${query}"`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName} style={{ marginBottom: 4 }}>
              <div style={{ padding: "8px 20px 4px", fontSize: 11, fontWeight: 700, color: appTheme.colors.textSecondary, letterSpacing: 0.4, textTransform: "uppercase" }}>
                {groupName}
              </div>
              {items.map((item) => {
                flatIndex += 1;
                const isActive = flatIndex === activeIndex;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 20px",
                      cursor: "pointer",
                      background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                      transition: "background 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                      borderLeft: isActive ? `3px solid ${appTheme.colors.primary}` : "3px solid transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: appTheme.radius.sm,
                        background: isActive ? appTheme.colors.primary : appTheme.colors.background,
                        color: isActive ? "#fff" : appTheme.colors.textSecondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 15,
                        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 14, color: appTheme.colors.textPrimary, display: "block" }}>
                        {highlight(item.title, query)}
                      </Text>
                      {item.subtitle ? (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </div>
                    {isActive ? <ArrowRightOutlined style={{ color: appTheme.colors.primary, fontSize: 13, flexShrink: 0 }} /> : null}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: "10px 20px",
          borderTop: `1px solid ${appTheme.colors.border}`,
          background: appTheme.colors.background,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Tag style={{ margin: 0, borderRadius: 8, fontSize: 11 }}>↑↓</Tag> Di chuyển
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Tag style={{ margin: 0, borderRadius: 8, fontSize: 11 }}>Enter</Tag> Chọn
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <Tag style={{ margin: 0, borderRadius: 8, fontSize: 11 }}>Ctrl+K</Tag> Mở nhanh
        </Text>
      </div>
    </Modal>
  );
}

export default GlobalSearchPalette;
