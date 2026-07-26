import { useEffect, useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Switch,
  Button,
  Typography,
  Divider,
  Space,
  Alert,
  message,
  Row,
  Col,
} from "antd";
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  ToolOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import { systemSettingsService } from "../../services/systemSettingsService";
import type { SystemSettings } from "../../services/systemSettingsService";
import { appTheme } from "../../../../constants/theme";

const { Title, Text, Paragraph } = Typography;

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SystemSettings>();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await systemSettingsService.getSettings();
      form.setFieldsValue(res);
    } catch (err) {
      console.error(err);
      message.error("Không tải được cấu hình hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFinish = async (values: SystemSettings) => {
    try {
      setSaving(true);
      await systemSettingsService.updateSettings(values);
      message.success("Đã cập nhật Cài đặt hệ thống thành công!");
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Lỗi khi lưu cài đặt!";
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Cài đặt & Cấu hình Hệ thống"
      subtitle="Cấu hình ngưỡng thuật toán AI Matching, cảnh báo tỷ lệ lỗi OCR, thời hạn tin tuyển dụng và quyền vận hành hệ thống"
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: appTheme.radius.lg,
              border: `1px solid ${appTheme.colors.border}`,
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              disabled={loading}
              initialValues={{
                minFitScoreThreshold: 70,
                ocrErrorNoticeThreshold: 15,
                jobDefaultDurationDays: 30,
                autoApproveRecruiters: false,
                systemMaintenanceMode: false,
              }}
            >
              <Title level={5} style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <SafetyCertificateOutlined style={{ color: appTheme.colors.primary }} /> Cấu hình Ngưỡng AI & OCR
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
                Thiết lập các ngưỡng số học định hướng đánh giá ứng viên và kích hoạt cảnh báo thông minh.
              </Paragraph>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="minFitScoreThreshold"
                    label="Ngưỡng điểm AI Phù hợp tối thiểu (%)"
                    tooltip="Ứng viên đạt từ ngưỡng điểm này trở lên sẽ được phân loại là Phù hợp cao (Match)"
                    rules={[{ required: true, message: "Vui lòng nhập ngưỡng điểm AI" }]}
                  >
                    <InputNumber min={0} max={100} addonAfter="%" style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="ocrErrorNoticeThreshold"
                    label="Ngưỡng cảnh báo Tỷ lệ lỗi OCR (%)"
                    tooltip="Kích hoạt cảnh báo trên Dashboard Admin khi tỷ lệ trích xuất lỗi vượt quá ngưỡng này"
                    rules={[{ required: true, message: "Vui lòng nhập ngưỡng lỗi OCR" }]}
                  >
                    <InputNumber min={0} max={100} addonAfter="%" style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "16px 0 24px" }} />

              <Title level={5} style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <ClockCircleOutlined style={{ color: "#F59E0B" }} /> Thời hạn & Vận hành Tin tuyển dụng
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
                Cấu hình thời hạn bài đăng mặc định khi Chuyên viên Tuyển dụng tạo mới.
              </Paragraph>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="jobDefaultDurationDays"
                    label="Thời hạn tin mặc định (ngày)"
                    rules={[{ required: true, message: "Vui lòng nhập số ngày thời hạn" }]}
                  >
                    <InputNumber min={1} max={365} addonAfter="ngày" style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "16px 0 24px" }} />

              <Title level={5} style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <ToolOutlined style={{ color: "#EF4444" }} /> Tự động hóa & Bảo trì
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
                Cấu hình nâng cao cho phép tự động duyệt tin hoặc bật chế độ bảo trì hệ thống.
              </Paragraph>

              <Form.Item
                name="autoApproveRecruiters"
                label="Tự động phê duyệt Tin tuyển dụng từ Recruiter uy tín"
                valuePropName="checked"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <Form.Item
                name="systemMaintenanceMode"
                label="Chế độ bảo trì hệ thống (Chỉ Quản trị viên truy cập)"
                valuePropName="checked"
              >
                <Switch checkedChildren="Bảo trì" unCheckedChildren="Bình thường" />
              </Form.Item>

              <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                <Space size={12}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                    size="large"
                    style={{ borderRadius: 8, paddingLeft: 24, paddingRight: 24 }}
                  >
                    Lưu cấu hình hệ thống
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={fetchSettings} size="large" style={{ borderRadius: 8 }}>
                    Tải lại
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Alert
            message="Lưu ý quan trọng cho Admin"
            description="Các thay đổi ngưỡng thuật toán AI và cảnh báo lỗi OCR sẽ có hiệu lực ngay lập tức trên toàn hệ thống. Hãy kiểm tra kỹ trước khi cập nhật."
            type="info"
            showIcon
            style={{ borderRadius: appTheme.radius.md, marginBottom: 16 }}
          />

          <Card
            title="Phiên bản & Môi trường"
            bordered={false}
            style={{ borderRadius: appTheme.radius.lg, border: `1px solid ${appTheme.colors.border}` }}
          >
            <Paragraph style={{ fontSize: 13, margin: 0 }}>
              <strong>Hệ thống:</strong> AI Recruitment Enterprise<br />
              <strong>Phiên bản Backend:</strong> .NET 8.0 WebAPI<br />
              <strong>Mô hình AI Core:</strong> Whitebox Skill Matrix & Semantic Matching v2<br />
              <strong>Môi trường:</strong> Production / Active
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
