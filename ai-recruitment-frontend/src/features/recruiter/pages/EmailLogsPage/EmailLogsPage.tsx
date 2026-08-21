import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Modal,
  Tag,
  Typography,
  Space,
  Empty,
  Spin,
  message,
  Alert,
} from "antd";
import {
  SearchOutlined,
  MailOutlined,
  EyeOutlined,
  ReloadOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import { recruitmentService } from "../../../../services/recruitmentService";
import dayjs from "dayjs";

const { Text } = Typography;

const sanitizeEmailHtml = (html: string): string => {
  if (typeof window === "undefined") return "";
  const documentNode = new DOMParser().parseFromString(html || "", "text/html");
  const allowedTags = new Set(["P", "STRONG", "UL", "LI", "BR"]);
  Array.from(documentNode.body.querySelectorAll("*")).forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(documentNode.createTextNode(element.textContent || ""));
      return;
    }
    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
  });
  return documentNode.body.innerHTML;
};

interface EmailLogDto {
  emailLogID: string;
  candidateID?: string;
  applicationID?: string;
  jobID?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  categoryName?: string;
  jobTitle?: string;
  candidateName?: string;
  sentAt: string;
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<string>("");

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLogDto | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data: any = await recruitmentService.getHrEmailLogs();
      const list = data?.$values || data || [];
      setLogs(list);
    } catch (error) {
      console.error("Lỗi khi tải nhật ký email:", error);
      setFetchError("Không thể tải nhật ký gửi email. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute unique categories and jobs for filters
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const jobs = new Set<string>();
    
    logs.forEach((log) => {
      if (log.categoryName) categories.add(log.categoryName);
      if (log.jobTitle) jobs.add(log.jobTitle);
    });

    return {
      categories: Array.from(categories),
      jobs: Array.from(jobs),
    };
  }, [logs]);

  // Filter logs based on search and selected options
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        (log.candidateName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.recipientEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = selectedCategory ? log.categoryName === selectedCategory : true;
      const matchJob = selectedJob ? log.jobTitle === selectedJob : true;

      return matchSearch && matchCategory && matchJob;
    });
  }, [logs, searchQuery, selectedCategory, selectedJob]);

  const handleOpenDetail = (log: EmailLogDto) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 180,
      render: (text: string, record: EmailLogDto) => (
        <Space direction="vertical" size={2}>
          <Space>
            <UserOutlined style={{ color: "#3B82F6" }} />
            <Text strong>{text || "Chưa rõ"}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
            {record.recipientEmail}
          </Text>
        </Space>
      ),
    },
    {
      title: "Công việc & Ngành nghề",
      key: "jobAndCategory",
      width: 250,
      render: (_: any, record: EmailLogDto) => (
        <Space direction="vertical" size={2}>
          {record.jobTitle ? (
            <Space>
              <FolderOpenOutlined style={{ color: "#10B981" }} />
              <Text style={{ fontSize: 13, fontWeight: 500 }}>{record.jobTitle}</Text>
            </Space>
          ) : (
            <Text type="secondary" italic style={{ fontSize: 13 }}>Không có thông tin việc làm</Text>
          )}
          {record.categoryName && (
            <Tag color="cyan" style={{ fontSize: 10, borderRadius: 4 }}>
              {record.categoryName}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Tiêu đề email",
      dataIndex: "subject",
      key: "subject",
      width: 280,
      render: (text: string) => (
        <Text strong style={{ color: "#1E293B", fontSize: 13 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "sentAt",
      key: "sentAt",
      width: 160,
      render: (dateStr: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: "#64748B" }} />
          <Text style={{ fontSize: 13 }}>{dayjs(dateStr).format("DD/MM/YYYY HH:mm")}</Text>
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      fixed: "right" as const,
      render: (_: any, record: EmailLogDto) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => handleOpenDetail(record)}
          size="small"
          style={{ borderRadius: 6 }}
        >
          Xem nội dung
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Nhật ký gửi email"
    >
      {fetchError && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu"
          description={fetchError}
          action={
            <Button size="small" type="primary" onClick={fetchLogs}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 20 }}
        />
      )}
      <div style={{ padding: "8px 0 24px" }}>
        {/* Filter controls */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(148,163,184,0.03)",
            border: "1px solid #E2E8F0",
          }}
          bodyStyle={{ padding: "16px 20px" }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flex: 1, minWidth: 300 }}>
              <Input
                placeholder="Tìm kiếm ứng viên, email, tiêu đề..."
                prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 260, borderRadius: 8 }}
                allowClear
              />
              
              <Select
                placeholder="Lọc theo Ngành nghề"
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 190 }}
                allowClear
                options={[
                  { value: "", label: "Tất cả ngành nghề" },
                  ...filterOptions.categories.map((c) => ({ value: c, label: c })),
                ]}
              />

              <Select
                placeholder="Lọc theo Công việc"
                value={selectedJob}
                onChange={setSelectedJob}
                style={{ width: 190 }}
                allowClear
                options={[
                  { value: "", label: "Tất cả công việc" },
                  ...filterOptions.jobs.map((j) => ({ value: j, label: j })),
                ]}
              />
            </div>

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchLogs}
              loading={loading}
              style={{ borderRadius: 8 }}
            >
              Làm mới
            </Button>
          </div>
        </Card>

        {/* Logs Table */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(148,163,184,0.04)",
            border: "1px solid #E2E8F0",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            loading={loading}
            dataSource={filteredLogs}
            columns={columns}
            rowKey="emailLogID"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: <Empty description="Chưa có nhật ký email nào khớp bộ lọc" />,
            }}
          />
        </Card>
      </div>

      {/* Email Detail Modal */}
      <Modal
        title={
          <Space>
            <MailOutlined style={{ color: "#2563EB" }} />
            <Text strong style={{ fontSize: 16 }}>Nội dung Email Chi Tiết</Text>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)} style={{ backgroundColor: "#2563EB" }}>
            Đóng
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {selectedLog && (
          <div style={{ padding: "12px 0" }}>
            <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0", marginBottom: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ width: 100, display: "inline-block" }}>Người nhận:</Text>
                <Text strong>{selectedLog.candidateName || "Chưa rõ"}</Text> 
                <Text type="secondary" style={{ marginLeft: 8 }}>({selectedLog.recipientEmail})</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ width: 100, display: "inline-block" }}>Tiêu đề:</Text>
                <Text strong>{selectedLog.subject}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ width: 100, display: "inline-block" }}>Công việc:</Text>
                <Text>{selectedLog.jobTitle || "Liên hệ trực tiếp"}</Text>
                {selectedLog.categoryName && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>{selectedLog.categoryName}</Tag>
                )}
              </div>
              <div>
                <Text type="secondary" style={{ width: 100, display: "inline-block" }}>Thời gian gửi:</Text>
                <Text>{dayjs(selectedLog.sentAt).format("DD/MM/YYYY HH:mm:ss")}</Text>
              </div>
            </div>

            <Text strong style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#475569" }}>NỘI DUNG THƯ:</Text>
            <div 
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "20px 24px",
                background: "#FFFFFF",
                maxHeight: 450,
                overflowY: "auto",
                lineHeight: "1.6",
                fontSize: 14,
                color: "#334155",
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(selectedLog.body) }}
            />
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
