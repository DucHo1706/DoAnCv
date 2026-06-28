import { EyeOutlined, RobotOutlined,LoadingOutlined, SearchOutlined, ReloadOutlined, ClockCircleOutlined, FileDoneOutlined, } from "@ant-design/icons";
import { Card, Typography, Table, Tag, message, Button, Drawer, Row, Col, Progress, Alert, Modal, Spin, Space, Input, Select} from "antd";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { recruitmentService } from "../../services/recruitmentService";
import PageContainer from "../../components/common/PageContainer";

const { Text, Title } = Typography;

function ApplicationStatusPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasHandledDeepLinkRef = useRef(false);
  const pollingTimerRef = useRef<number | null>(null);
  const processingModalRef = useRef<any>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const normalizeApplicationsData = (data: any) => {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.$values || [];
};

const fetchMyApps = async (showLoading = true) => {
  try {
    if (showLoading === true) {
      setLoading(true);
    }

    const data: any = await recruitmentService.getMyApplications();
    const normalizedApplications = normalizeApplicationsData(data);

    setApplications(normalizedApplications);

    return normalizedApplications;
  } catch (error) {
    message.error("Không tải được lịch sử ứng tuyển.");
    return [];
  } finally {
    if (showLoading === true) {
      setLoading(false);
    }
  }
};

useEffect(() => {
  fetchMyApps();
}, []);

  const getApplicationId = (application: any) => {
  return (
    application?.id ||
    application?.applicationId ||
    application?.applicationID ||
    ""
  );
};

const isAiError = (application: any) => {
  if (!application) {
    return false;
  }

  if (application.classification === "AI_ERROR") {
    return true;
  }

  return false;
};

const isAiReady = (application: any) => {
  if (!application) {
    return false;
  }

  if (isAiError(application) === true) {
    return false;
  }

  if (application.hasAiEvaluation === true) {
    return true;
  }

  const classification = application.classification || "";

  if (
    classification &&
    classification !== "Chưa phân loại" &&
    classification !== "AI_ERROR"
  ) {
    return true;
  }

  if (
    Array.isArray(application.criteriaResults) &&
    application.criteriaResults.length > 0
  ) {
    return true;
  }

  const reason = application.aiReason || "";

  if (
    reason &&
    reason !== "Đang chờ phân tích" &&
    reason !== "AI đang phân tích" &&
    reason.trim().length > 0
  ) {
    return true;
  }

  return false;
};

const openAiDrawer = (application: any) => {
  setSelectedApp(application);
  setIsDetailModalOpen(true);
};

const showAiErrorModal = () => {
  Modal.error({
    title: "AI chưa thể phân tích hồ sơ",
    centered: true,
    okText: "Đóng",
    content: (
      <div style={{ marginTop: 12 }}>
        <Typography.Paragraph>
          Hệ thống AI tạm thời chưa phân tích được hồ sơ này. Có thể dịch vụ AI
          đang bận hoặc gặp lỗi kết nối.
        </Typography.Paragraph>

        <Typography.Paragraph type="secondary">
          Hồ sơ của bạn vẫn đã được gửi đến nhà tuyển dụng thành công. Bạn có
          thể quay lại kiểm tra sau.
        </Typography.Paragraph>
      </div>
    ),
  });
};

  const clearPollingTimer = () => {
  if (pollingTimerRef.current !== null) {
    window.clearInterval(pollingTimerRef.current);
    pollingTimerRef.current = null;
  }
};

const closeProcessingModal = () => {
  if (processingModalRef.current) {
    processingModalRef.current.destroy();
    processingModalRef.current = null;
  }
};

const startPollingAiResult = (applicationId: string) => {
  clearPollingTimer();

  let retryCount = 0;
  const maxRetryCount = 30;

  pollingTimerRef.current = window.setInterval(async () => {
    try {
      retryCount = retryCount + 1;

      const latestApplications = await fetchMyApps(false);

      const targetApplication = latestApplications.find((application: any) => {
        return getApplicationId(application) === applicationId;
      });

      if (!targetApplication) {
        return;
      }

      if (isAiReady(targetApplication) === true) {
        clearPollingTimer();
        closeProcessingModal();

        message.success("Quá trình AI phân tích hồ sơ đã hoàn tất.");

        setTimeout(() => {
          openAiDrawer(targetApplication);
        }, 300);

        return;
      }

      if (isAiError(targetApplication) === true) {
        clearPollingTimer();
        closeProcessingModal();

        setTimeout(() => {
          showAiErrorModal();
        }, 300);

        return;
      }

      if (retryCount >= maxRetryCount) {
        clearPollingTimer();
        closeProcessingModal();

        message.info(
          "AI vẫn đang phân tích hồ sơ. Bạn có thể quay lại kiểm tra sau."
        );
      }
    } catch (error) {
      console.error("Lỗi khi polling kết quả AI:", error);
    }
  }, 3000);
};

const showAiProcessingModal = (application: any) => {
  const applicationId = getApplicationId(application);

  if (!applicationId) {
    message.error("Không tìm thấy mã hồ sơ ứng tuyển.");
    return;
  }

  closeProcessingModal();

  processingModalRef.current = Modal.info({
    title: "AI đang phân tích hồ sơ",
    centered: true,
    width: 560,
    okText: "Đóng",
    afterClose: () => {
      processingModalRef.current = null;
    },
    content: (
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: "50%",
            background: "#f0f7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <Spin size="large" />
        </div>

        <Typography.Paragraph style={{ fontSize: 16, marginBottom: 8 }}>
          Hệ thống AI đang đọc kỹ CV của bạn, vui lòng chờ trong giây lát...
        </Typography.Paragraph>

        <Typography.Paragraph type="secondary">
          Hồ sơ ứng tuyển vị trí{" "}
          <Text strong>{application?.jobTitle || "này"}</Text> đã được ghi
          nhận. AI đang đối chiếu CV với tiêu chí tuyển dụng của nhà tuyển dụng.
        </Typography.Paragraph>

        <div
          style={{
            background: "#fafafa",
            border: "1px dashed #d9d9d9",
            borderRadius: 12,
            padding: 14,
            marginTop: 16,
          }}
        >
          <Space direction="vertical" size={6}>
            <Text type="secondary">Đang bóc tách thông tin CV...</Text>
            <Text type="secondary">Đang so khớp kỹ năng với tin tuyển dụng...</Text>
            <Text type="secondary">Đang chuẩn bị nhận xét và điểm phù hợp...</Text>
          </Space>
        </div>
      </div>
    ),
  });

    startPollingAiResult(applicationId);
  };

  const handleViewDetail = (record: any) => {
    if (isAiError(record) === true) {
      showAiErrorModal();
      return;
    }

    if (isAiReady(record) === false) {
      showAiProcessingModal(record);
      return;
    }

    openAiDrawer(record);
  };

  useEffect(() => {
  const applicationIdFromUrl = searchParams.get("showAiDetail");

  if (!applicationIdFromUrl) {
    return;
  }

  if (applications.length === 0) {
    return;
  }

  if (hasHandledDeepLinkRef.current === true) {
    return;
  }

  const targetApplication = applications.find((application) => {
    return getApplicationId(application) === applicationIdFromUrl;
  });

  if (!targetApplication) {
    return;
  }

  hasHandledDeepLinkRef.current = true;

  if (isAiError(targetApplication) === true) {
    showAiErrorModal();
  } else if (isAiReady(targetApplication) === true) {
    openAiDrawer(targetApplication);
  } else {
    showAiProcessingModal(targetApplication);
  }

  setSearchParams({}, { replace: true });
}, [applications, searchParams]);

  useEffect(() => {
    return () => {
      clearPollingTimer();
      closeProcessingModal();
    };
  }, []);

  const filteredApplications = applications.filter((application) => {
  const keyword = searchText.trim().toLowerCase();

  const jobTitle = application?.jobTitle?.toLowerCase() || "";

  const matchesSearch =
    keyword.length === 0 || jobTitle.includes(keyword);

  let matchesStatus = true;

  if (statusFilter === "processing") {
    matchesStatus = isAiReady(application) === false && isAiError(application) === false;
  }

  if (statusFilter === "completed") {
    matchesStatus = isAiReady(application) === true;
  }

  if (statusFilter === "failed") {
    matchesStatus = isAiError(application) === true;
  }

  return matchesSearch && matchesStatus;
});

  const renderApplicationStatus = (record: any) => {
  if (isAiError(record) === true) {
    return (
      <Tag color="red" style={{ padding: "6px 12px", borderRadius: 8 }}>
        <RobotOutlined style={{ marginRight: 6 }} />
        AI lỗi
      </Tag>
    );
  }

  if (isAiReady(record) === false) {
    return (
      <Tag color="processing" style={{ padding: "6px 12px", borderRadius: 8 }}>
        <LoadingOutlined style={{ marginRight: 6 }} />
        AI đang phân tích
      </Tag>
    );
  }

  return (
    <Tag color="blue" style={{ padding: "6px 12px", borderRadius: 8 }}>
      <FileDoneOutlined style={{ marginRight: 6 }} />
      Đã gửi HR
    </Tag>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 75) {
    return "#22c55e";
  }

  if (score >= 50) {
    return "#faad14";
  }

  return "#ff4d4f";
};

const renderScoreCircle = (
  score: number,
  variant: "table" | "drawer" = "table"
) => {
  const finalScore = Math.round(Number(score || 0));
  const color = getScoreColor(finalScore);

  const size = variant === "drawer" ? 128 : 78;
  const strokeWidth = variant === "drawer" ? 7 : 6;
  const fontSize = variant === "drawer" ? 30 : 22;

  return (
    <Progress
      type="circle"
      percent={finalScore}
      size={size}
      strokeWidth={strokeWidth}
      strokeColor={color}
      trailColor="#e5e7eb"
      format={() => (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            transform: "translateY(-1px)",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: fontSize,
              color: color,
              display: "inline-block",
            }}
          >
            {finalScore}
          </span>
        </div>
      )}
    />
  );
};


const renderSkillTags = (
  skills: string[] | undefined,
  color: "green" | "red",
  emptyText: string,
  keyPrefix: string
) => {
  if (!skills || skills.length === 0) {
    return <Text type="secondary">{emptyText}</Text>;
  }

  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "flex-start",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {skills.map((skill: string, index: number) => (
        <Tag
          color={color}
          key={`${keyPrefix}-${index}`}
          style={{
            margin: 0,
            maxWidth: "100%",
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            lineHeight: 1.6,
            padding: "3px 8px",
            borderRadius: 8,
            display: "inline-block",
          }}
        >
          {skill}
        </Tag>
      ))}
    </div>
  );
};

  const columns = [
  {
    title: "Thông tin ứng tuyển",
    key: "applicationInfo",
    render: (_: any, record: any) => (
      <div>
        <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
          {record.jobTitle || "Chưa cập nhật vị trí"}
        </Text>

        <div style={{ marginTop: 10 }}>
          <Text type="secondary">
            <ClockCircleOutlined style={{ marginRight: 6 }} />
            Đã nộp:{" "}
            {record.appliedAt
              ? new Date(record.appliedAt).toLocaleDateString("vi-VN")
              : "Chưa có thời gian"}
          </Text>
        </div>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    key: "status",
    width: 180,
    render: (_: any, record: any) => renderApplicationStatus(record),
  },
  {
    title: "Điểm AI",
    dataIndex: "aiScore",
    key: "aiScore",
    width: 160,
    align: "center" as const,
    render: (score: number, record: any) => {
      if (isAiError(record) === true) {
        return (
          <Tag color="red" style={{ padding: "6px 12px", borderRadius: 8 }}>
            AI lỗi
          </Tag>
        );
      }

      if (isAiReady(record) === false) {
        return (
          <Spin indicator={<LoadingOutlined spin />} />
        );
      }

      const finalScore = Math.round(Number(score || 0));

      return renderScoreCircle(score, "table");
    },
  },
  {
    title: "Hành động",
    key: "action",
    width: 220,
    align: "center" as const,
    render: (_: any, record: any) => (
      <Button
        type="primary"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(record)}
        style={{
          height: 46,
          borderRadius: 10,
          fontWeight: 600,
          padding: "0 22px",
          boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
        }}
      >
        {isAiReady(record) ? "Xem AI đánh giá" : "Theo dõi AI"}
      </Button>
    ),
  },
];

  return (
    <PageContainer
  title=""
  subtitle=""
>
  <div
    style={{
      background: "#f1f5f9",
      margin: "-24px",
      padding: "48px 40px 80px",
      minHeight: "calc(100vh - 80px)",
    }}
  >
    <div style={{ marginBottom: 28 }}>
      <Title level={2} style={{ marginBottom: 8, color: "#0f172a" }}>
        Lịch sử ứng tuyển
      </Title>

      <Text type="secondary" style={{ fontSize: 16 }}>
        Theo dõi các công việc bạn đã nộp CV và xem lại phân tích mức độ phù hợp từ AI.
      </Text>
    </div>

    <Card
      style={{
        borderRadius: 18,
        marginBottom: 24,
        border: "none",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
      }}
      bodyStyle={{ padding: 28 }}
    >
      <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Input
                size="large"
                allowClear
                prefix={<SearchOutlined style={{ color: "#64748b" }} />}
                placeholder="Tìm kiếm theo tên vị trí ứng tuyển..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                style={{
                  height: 48,
                  borderRadius: 14,
                }}
              />
            </Col>

            <Col xs={24} md={8}>
              <Select
                size="large"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: "100%", height: 48 }}
                options={[
                  {
                    value: "all",
                    label: "Tất cả trạng thái",
                  },
                  {
                    value: "processing",
                    label: "AI đang phân tích",
                  },
                  {
                    value: "completed",
                    label: "AI đã hoàn tất",
                  },
                  {
                    value: "failed",
                    label: "AI lỗi",
                  },
                ]}
              />
            </Col>
          </Row>
    </Card>

    <Card
      style={{
        borderRadius: 18,
        border: "none",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
      }}
      bodyStyle={{ padding: "28px 28px 36px" }}
    >
      <Table
        columns={columns}
        dataSource={filteredApplications}
        rowKey={(record: any) => record.id || record.applicationId}
        loading={loading}
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          position: ["bottomRight"],
        }}
        locale={{ emptyText: "Bạn chưa nộp CV vào vị trí nào." }}
        style={{
          overflow: "hidden",
          borderRadius: 14,
        }}
      />
    </Card>
  </div>
      <Drawer
        title={<span><RobotOutlined style={{ color: '#1677ff', marginRight: 8 }}/> Báo cáo Phân tích từ AI</span>}
        placement="right"
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        width={760}
      >
        {selectedApp && (
          <div>
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24, marginTop: 16 }}>
              <Col span={6} style={{ textAlign: "center" }}>
                {renderScoreCircle(selectedApp?.aiScore || 0, "drawer")}
              </Col>
              <Col span={18}>
                <Typography.Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                  Vị trí: {selectedApp.jobTitle}
                </Typography.Title>
                <div>
                  Phân loại:{" "}
                  <Tag color={
                    selectedApp.classification === "Phù hợp" || selectedApp.classification === "Phù hợp cao" ? "green" :
                    selectedApp.classification === "Nên xem xét" ? "orange" : "red"
                  }>
                    {selectedApp.classification || "Chưa phân loại"}
                  </Tag>
                </div>
              </Col>
            </Row>

            <Alert message="Trí tuệ nhân tạo (AI) nhận xét:" description={selectedApp.aiReason} type="info" showIcon style={{ marginBottom: 24 }} />

            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={12} style={{ minWidth: 0 }}>
                <Text strong>✅ Kỹ năng đáp ứng được (CV có):</Text>

                {renderSkillTags(
                  selectedApp.matchedSkills,
                  "green",
                  "Không có",
                  "matched"
                )}
              </Col>

              <Col xs={24} md={12} style={{ minWidth: 0 }}>
                <Text strong>❌ Kỹ năng còn thiếu (JD yêu cầu):</Text>

                {renderSkillTags(
                  selectedApp.missingSkills,
                  "red",
                  "Hồ sơ của bạn đã đáp ứng đầy đủ các yêu cầu cốt lõi của vị trí này.",
                  "missing"
                )}
              </Col>
            </Row>
            
            <Typography.Title level={5}>Điểm chi tiết theo từng tiêu chí</Typography.Title>
            <Table
              dataSource={selectedApp.criteriaResults || []}
              rowKey={(record: any) => record.criterionName || record.criterion_name}
              pagination={false}
              size="small"
              bordered
              columns={[
                { title: 'Tiêu chí đánh giá', key: 'criterionName', width: '30%', render: (_: any, record: any) => record.criterionName || record.criterion_name || "Chưa có tên" },
                { title: 'Trọng số', key: 'weight', width: '10%', render: (_: any, record: any) => `${record.weight || 0}%` },
                { title: 'Điểm', key: 'score', width: '15%', render: (_: any, record: any) => (<strong>{record.score || 0} / {record.maxScore || record.max_score || 0}</strong>) },
                { title: 'AI Giải thích', dataIndex: 'comment', key: 'comment', width: '45%' }
              ]}
              locale={{ emptyText: "Không có dữ liệu tiêu chí đánh giá" }}
            />
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}

export default ApplicationStatusPage;