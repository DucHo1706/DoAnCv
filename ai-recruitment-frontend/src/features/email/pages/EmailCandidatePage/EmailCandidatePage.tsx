import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  RobotOutlined,
  SendOutlined,
  UploadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import RichTextEditor from "./components/RichTextEditor";
import EmailRecipientsEditor from "./components/EmailRecipientsEditor";
import { useEmailCandidate } from "./hooks/useEmailCandidate";

const { Text, Paragraph } = Typography;

export default function EmailCandidatePage() {
  const {
    navigate,
    candidate,
    loading,
    subject,
    setSubject,
    content,
    setContent,
    toEmail,
    setToEmail,
    ccEmail,
    setCcEmail,
    isEditingRecipients,
    setIsEditingRecipients,
    isSending,
    isGeneratingAi,
    isRejectReasonModalOpen,
    setIsRejectReasonModalOpen,
    isCustomRejectReasonMode,
    setIsCustomRejectReasonMode,
    customRejectReason,
    setCustomRejectReason,
    getScoreColor,
    getAiRecommendation,
    generateAiEmail,
    handleSelectRejectReason,
    handleCreateCustomRejectEmail,
    uploadProps,
    handleSendEmail,
    isTalentPoolInvite,
  } = useEmailCandidate();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageContainer
      title="Soạn Email gửi Ứng viên"
      subtitle="Sử dụng AI để phác thảo email hoặc tự viết nội dung cá nhân hóa."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12 }}>
            {/* Thông tin người nhận email */}
            <div
              style={{
                padding: "12px 16px",
                background: "#f0f5ff",
                borderRadius: 8,
                marginBottom: 16,
                border: "1px solid #b6e3ff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Text strong>{candidate?.candidateName || candidate?.fullName}</Text>

                  <div style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 13 }}>
                      <strong>Gửi tới (To):</strong>{" "}
                      <span
                        style={{
                          color: "#1677ff",
                          fontFamily: "monospace",
                          fontWeight: 500,
                        }}
                      >
                        {toEmail || "Chưa cấu hình"}
                      </span>
                    </Text>
                    {toEmail && candidate?.cvEmail && toEmail === candidate.cvEmail && (
                      <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                        Email từ CV
                      </Tag>
                    )}
                  </div>

                  {ccEmail && (
                    <div style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 13 }}>
                        <strong>(CC):</strong>{" "}
                        <span
                          style={{
                            color: "#faad14",
                            fontFamily: "monospace",
                            fontWeight: 500,
                          }}
                        >
                          {ccEmail}
                        </span>
                      </Text>
                      {candidate?.accountEmail && ccEmail === candidate.accountEmail && (
                        <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>
                          Email tài khoản
                        </Tag>
                      )}
                    </div>
                  )}

                  {/* Giải thích logic To/CC */}
                  <div style={{ marginTop: 8 }}>
                    <Alert
                      type="info"
                      message={
                        <Text style={{ fontSize: 12 }}>
                          {candidate?.cvEmail && candidate?.accountEmail
                            ? candidate.cvEmail === candidate.accountEmail
                              ? "✓ Email CV và tài khoản giống nhau, gửi tới email CV"
                              : `✓ Email CV khác tài khoản, gửi tới email CV và CC email tài khoản`
                            : candidate?.cvEmail
                              ? "✓ Chỉ bóc tách được email CV, gửi tới email CV"
                              : "⚠ Không bóc tách được email ứng viên cung cấp trong CV, nên hiện tại gửi tới email tài khoản ứng viên"}
                        </Text>
                      }
                      style={{ padding: "6px 12px", marginTop: 8 }}
                      showIcon={false}
                    />
                  </div>
                </div>

                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsEditingRecipients(true)}
                  disabled={isSending}
                >
                  Chỉnh sửa
                </Button>
              </div>
            </div>

            <Space
              style={{
                marginBottom: 16,
                width: "100%",
                justifyContent: "flex-end",
              }}
            >
              <Button
                icon={<RobotOutlined />}
                onClick={() => generateAiEmail("invite")}
                disabled={isGeneratingAi || isSending}
                style={{ borderColor: "#52c41a", color: "#52c41a" }}
              >
                {isTalentPoolInvite ? "AI Soạn Thư Mời Talent Pool" : "AI Soạn Thư Mời"}
              </Button>

              {!isTalentPoolInvite && (
                <Button
                  icon={<RobotOutlined />}
                  onClick={() => generateAiEmail("reject")}
                  disabled={isGeneratingAi || isSending}
                  style={{ borderColor: "#ff4d4f", color: "#ff4d4f" }}
                >
                  AI Soạn Thư Từ Chối
                </Button>
              )}
            </Space>

            <Input
              size="large"
              placeholder="Tiêu đề Email"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              style={{ marginBottom: 16 }}
              disabled={isSending}
            />

            <div style={{ position: "relative" }}>
              {isGeneratingAi && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    background: "rgba(255, 255, 255, 0.72)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                >
                  <Spin tip="AI đang phân tích hồ sơ và soạn email..." />
                </div>
              )}

              <RichTextEditor
                value={content}
                onChange={setContent}
                disabled={isSending || isGeneratingAi}
                placeholder="Nội dung Email..."
              />
            </div>

            <Divider />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} disabled={isSending}>
                  Đính kèm file
                </Button>
              </Upload>

              <div style={{ whiteSpace: "nowrap" }}>
                <Button
                  size="large"
                  style={{ marginRight: 12 }}
                  onClick={() => navigate(-1)}
                  disabled={isSending}
                >
                  Hủy bỏ
                </Button>

                <Button
                  size="large"
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendEmail}
                  loading={isSending}
                  disabled={isGeneratingAi}
                >
                  Gửi Email Này
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Gợi ý từ AI Hệ thống" style={{ borderRadius: 12, background: "#f8fafc" }}>
            <Paragraph>
              Hệ thống đánh giá ứng viên này đạt{" "}
              <Tag color={getScoreColor()}>{candidate?.aiScore} điểm</Tag>.
            </Paragraph>

            <Paragraph type="secondary">Khuyến nghị: {getAiRecommendation()}</Paragraph>

            <Divider />

            <Text strong style={{ fontSize: 12, color: "#666" }}>
              THÔNG TIN EMAIL
            </Text>
            <div style={{ marginTop: 12, fontSize: 12 }}>
              {candidate?.cvEmail && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Email CV:</Text>
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: "#1677ff",
                      marginTop: 2,
                    }}
                  >
                    {candidate.cvEmail}
                  </div>
                </div>
              )}
              {candidate?.accountEmail && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Email Tài khoản:</Text>
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: "#faad14",
                      marginTop: 2,
                    }}
                  >
                    {candidate.accountEmail}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Modal chỉnh sửa To/CC */}
      {isEditingRecipients && (
        <EmailRecipientsEditor
          toEmail={toEmail}
          ccEmail={ccEmail}
          onToEmailChange={setToEmail}
          onCcEmailChange={setCcEmail}
          onCancel={() => setIsEditingRecipients(false)}
        />
      )}

      {/* Modal lý do từ chối */}
      <Modal
        title="Chọn lý do từ chối"
        open={isRejectReasonModalOpen}
        onCancel={() => {
          setIsRejectReasonModalOpen(false);
          setIsCustomRejectReasonMode(false);
          setCustomRejectReason("");
        }}
        footer={null}
      >
        <Paragraph>
          Ứng viên này có điểm số cao. Vui lòng chọn lý do từ chối để AI soạn thư khéo léo và tránh
          mâu thuẫn với kết quả đánh giá.
        </Paragraph>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button block onClick={() => handleSelectRejectReason("closed")}>
            Đã tuyển đủ người
          </Button>

          <Button block onClick={() => handleSelectRejectReason("career_path")}>
            Định hướng/lộ trình công việc chưa phù hợp
          </Button>

          <Button block onClick={() => handleSelectRejectReason("overqualified")}>
            Overqualified - Kinh nghiệm vượt quá yêu cầu
          </Button>

          <Button block onClick={() => setIsCustomRejectReasonMode(true)}>
            Lý do khác
          </Button>

          {isCustomRejectReasonMode && (
            <div style={{ marginTop: 8 }}>
              <Input
                placeholder="Nhập lý do từ chối cụ thể..."
                value={customRejectReason}
                onChange={(event) => setCustomRejectReason(event.target.value)}
                onPressEnter={handleCreateCustomRejectEmail}
              />

              <Button
                type="primary"
                block
                style={{ marginTop: 12 }}
                onClick={handleCreateCustomRejectEmail}
              >
                Tạo thư từ chối theo lý do này
              </Button>
            </div>
          )}
        </Space>
      </Modal>
    </PageContainer>
  );
}
