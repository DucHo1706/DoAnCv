import React from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Typography, Space, Divider, Button } from "antd";
import {
  DollarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ExperimentOutlined,
  StarOutlined,
  TeamOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { appTheme } from "../../../../../constants/theme";

const { Title, Text, Paragraph } = Typography;

interface JobDetailContentProps {
  job: any;
  appliedApplication: any;
  showApplyModal: () => void;
  handleApplyWithAI: () => void;
  relatedJobs?: any[];
}

const JobDetailContent: React.FC<JobDetailContentProps> = ({
  job,
  appliedApplication,
  showApplyModal,
  handleApplyWithAI,
  relatedJobs = [],
}) => {
  const navigate = useNavigate();
  return (
    <>
      {/* 1. KHU VỰC HERO CARD (TOP) */}
      <Card
        bodyStyle={{ padding: 28 }}
        style={{
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: appTheme.shadow.card,
          border: `1px solid ${appTheme.colors.border}`,
          background: appTheme.colors.surface,
        }}
      >
        <Row gutter={24} align="middle">
          <Col flex="120px">
            <img
              src={job.logo}
              alt="Company Logo"
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
                borderRadius: 12,
                border: `1px solid ${appTheme.colors.border}`,
                padding: 8,
                background: "#fff",
              }}
            />
          </Col>
          <Col flex="auto" style={{ minWidth: 0 }}>
            <Title level={2} style={{ margin: 0, fontSize: 22, color: appTheme.colors.textPrimary, marginBottom: 6, fontFamily: appTheme.font.family, fontWeight: 700 }}>
              {job.title}
            </Title>
            <Text style={{ fontSize: 16, color: appTheme.colors.textSecondary, display: "block", marginBottom: 16, fontFamily: appTheme.font.family }}>
              {job.company}
            </Text>

            <Space size="large" split={<Divider type="vertical" style={{ height: 20 }} />} wrap>
              <Space align="center" size={12}>
                <div
                  style={{
                    background: "rgba(37, 99, 235, 0.08)",
                    padding: 8,
                    borderRadius: "50%",
                    color: appTheme.colors.primary,
                    display: "flex",
                  }}
                >
                  <DollarOutlined style={{ fontSize: 18 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ display: "block", fontSize: 12, fontFamily: appTheme.font.family }}>
                    Mức lương
                  </Text>
                  <Text strong style={{ fontSize: 15, color: appTheme.colors.success, fontFamily: appTheme.font.family }}>
                    {job.salary}
                  </Text>
                </div>
              </Space>
              <Space align="center" size={12}>
                <div
                  style={{
                    background: "rgba(37, 99, 235, 0.08)",
                    padding: 8,
                    borderRadius: "50%",
                    color: appTheme.colors.primary,
                    display: "flex",
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 18 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ display: "block", fontSize: 12, fontFamily: appTheme.font.family }}>
                    Địa điểm
                  </Text>
                  <Text strong style={{ fontSize: 15, fontFamily: appTheme.font.family, color: appTheme.colors.textPrimary }}>
                    {job.location}
                  </Text>
                </div>
              </Space>
              <Space align="center" size={12}>
                <div
                  style={{
                    background: "rgba(37, 99, 235, 0.08)",
                    padding: 8,
                    borderRadius: "50%",
                    color: appTheme.colors.primary,
                    display: "flex",
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 18 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ display: "block", fontSize: 12, fontFamily: appTheme.font.family }}>
                    Hạn nộp hồ sơ
                  </Text>
                  <Text strong style={{ fontSize: 15, fontFamily: appTheme.font.family, color: appTheme.colors.textPrimary }}>
                    {job.deadline
                      ? new Date(job.deadline).toLocaleDateString("vi-VN")
                      : "Không giới hạn"}
                  </Text>
                </div>
              </Space>
            </Space>
          </Col>
          <Col style={{ flexShrink: 0 }}>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <Button
                type={appliedApplication ? "default" : "primary"}
                size="large"
                icon={appliedApplication ? <CheckCircleOutlined /> : <SendOutlined />}
                onClick={appliedApplication ? undefined : showApplyModal}
                disabled={!!appliedApplication}
                style={{
                  width: 220,
                  height: 44,
                  fontSize: 15,
                  borderRadius: 12,
                  background: appliedApplication ? "#f5f5f5" : appTheme.colors.primary,
                  borderColor: appliedApplication ? "#d9d9d9" : appTheme.colors.primary,
                  color: appliedApplication ? "#8c8c8c" : "#fff",
                  fontWeight: 600,
                  fontFamily: appTheme.font.family,
                }}
              >
                {appliedApplication ? "Đã ứng tuyển" : "Ứng tuyển ngay"}
              </Button>
              {!appliedApplication && (
                <Button
                  size="large"
                  icon={<ExperimentOutlined />}
                  onClick={handleApplyWithAI}
                  style={{
                    width: 220,
                    height: 44,
                    fontSize: 14,
                    borderRadius: 12,
                    background: "#EFF6FF",
                    borderColor: "#BFDBFE",
                    color: "#2563EB",
                    border: "1px solid #BFDBFE",
                    fontWeight: 600,
                    fontFamily: appTheme.font.family,
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.04)",
                  }}
                >
                  AI Phân tích & Ứng tuyển
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 2. KHU VỰC CHI TIẾT */}
      <Row gutter={24}>
        {/* Cột trái: Chi tiết JD */}
        <Col xs={24} lg={16} xl={17}>
          <Card
            title={<Title level={4} style={{ margin: 0, fontFamily: appTheme.font.family, fontWeight: 600, fontSize: 18 }}>Chi tiết tin tuyển dụng</Title>}
            style={{
              borderRadius: 16,
              marginBottom: 24,
              boxShadow: appTheme.shadow.card,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ fontSize: 16, marginTop: 0, marginBottom: 12, fontFamily: appTheme.font.family, fontWeight: 600, color: appTheme.colors.textPrimary }}>
              Mô tả công việc
            </Title>
            <Paragraph style={{ fontSize: 14, whiteSpace: "pre-line", lineHeight: 1.7, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family }}>
              {job.description || "Đang cập nhật nội dung..."}
            </Paragraph>

            <Title level={5} style={{ fontSize: 16, marginTop: 24, marginBottom: 12, fontFamily: appTheme.font.family, fontWeight: 600, color: appTheme.colors.textPrimary }}>
              Yêu cầu ứng viên
            </Title>
            <Paragraph style={{ fontSize: 14, whiteSpace: "pre-line", lineHeight: 1.7, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family }}>
              {job.requirements || "Đang cập nhật nội dung..."}
            </Paragraph>

            <Divider style={{ margin: "32px 0 24px" }} />

            <Title level={5} style={{ fontSize: 16, marginBottom: 16, fontFamily: appTheme.font.family, fontWeight: 600, color: appTheme.colors.textPrimary }}>
              Cách thức ứng tuyển
            </Title>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: 20,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 14, display: "block", fontFamily: appTheme.font.family, color: "#166534" }}>
                Ứng viên nộp hồ sơ trực tuyến bằng cách bấm vào nút <strong>Ứng tuyển ngay</strong> hoặc <strong>AI Phân tích & Ứng tuyển</strong> ở đầu trang để được trợ lý AI phân tích và đưa ra gợi ý tối ưu CV trước khi nộp.
              </Text>
            </div>
          </Card>
        </Col>

        {/* Cột phải: Thông tin chung & Công ty */}
        <Col xs={24} lg={8} xl={7}>
          {/* Bảng Thông tin chung */}
          <Card
            title={<Title level={5} style={{ margin: 0, fontFamily: appTheme.font.family, fontWeight: 600, fontSize: 15 }}>Thông tin chung</Title>}
            style={{
              borderRadius: 16,
              marginBottom: 24,
              boxShadow: appTheme.shadow.card,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
            }}
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: 8,
                    borderRadius: "50%",
                    color: "#64748B",
                    display: "flex",
                  }}
                >
                  <StarOutlined style={{ fontSize: 16 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ display: "block", fontSize: 12, fontFamily: appTheme.font.family }}>
                    Cấp bậc
                  </Text>
                  <Text strong style={{ fontSize: 14, fontFamily: appTheme.font.family, color: appTheme.colors.textPrimary }}>
                    Nhân viên
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: 8,
                    borderRadius: "50%",
                    color: "#64748B",
                    display: "flex",
                  }}
                >
                  <TeamOutlined style={{ fontSize: 16 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ display: "block", fontSize: 12, fontFamily: appTheme.font.family }}>
                    Số lượng tuyển
                  </Text>
                  <Text strong style={{ fontSize: 14, fontFamily: appTheme.font.family, color: appTheme.colors.textPrimary }}>
                    {job.maxCandidates ? `${job.maxCandidates} người` : "Không giới hạn"}
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: 8,
                    borderRadius: "50%",
                    color: "#64748B",
                    display: "flex",
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 16 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ display: "block", fontSize: 12, fontFamily: appTheme.font.family }}>
                    Hình thức làm việc
                  </Text>
                  <Text strong style={{ fontSize: 14, fontFamily: appTheme.font.family, color: appTheme.colors.textPrimary }}>
                    {job.type}
                  </Text>
                </div>
              </div>
            </Space>
          </Card>

          {/* Bảng Thông tin công ty */}
          <Card
            title={<Title level={5} style={{ margin: 0, fontFamily: appTheme.font.family, fontWeight: 600, fontSize: 15 }}>Thông tin công ty</Title>}
            style={{
              borderRadius: 16,
              boxShadow: appTheme.shadow.card,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <img
                src={job.logo}
                alt="logo"
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "contain",
                  border: `1px solid ${appTheme.colors.border}`,
                  borderRadius: 8,
                  padding: 4,
                  background: "#fff",
                }}
              />
              <Text strong style={{ fontSize: 14, fontFamily: appTheme.font.family, color: appTheme.colors.textPrimary }}>{job.company}</Text>
            </div>
            <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 13, fontFamily: appTheme.font.family }}>
              <BankOutlined /> Quy mô: 100 - 499 nhân viên
            </Text>
            <Text type="secondary" style={{ display: "block", fontSize: 13, fontFamily: appTheme.font.family }}>
              <EnvironmentOutlined /> Địa chỉ: {job.location}
            </Text>
          </Card>

          {/* Bảng Việc làm tương tự */}
          {relatedJobs && relatedJobs.length > 0 && (
            <Card
              title={<Title level={5} style={{ margin: 0, fontFamily: appTheme.font.family, fontWeight: 600, fontSize: 15 }}>Việc làm tương tự</Title>}
              style={{
                borderRadius: 16,
                marginTop: 24,
                boxShadow: appTheme.shadow.card,
                border: `1px solid ${appTheme.colors.border}`,
                background: appTheme.colors.surface,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {relatedJobs.map((rJob: any) => (
                  <div
                    key={rJob.id}
                    onClick={() => {
                      navigate(`/jobs/${rJob.id}`);
                      window.scrollTo(0, 0);
                    }}
                    className="hover-card"
                    style={{
                      cursor: "pointer",
                      paddingBottom: 12,
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <Text strong style={{ display: "block", fontSize: 14, color: appTheme.colors.textPrimary, marginBottom: 4 }}>
                      {rJob.title}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{rJob.location}</Text>
                      <Text strong style={{ color: appTheme.colors.primary, fontSize: 13 }}>{rJob.salary}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
};

export default JobDetailContent;
