import React from "react";
import { Form, Input, Row, Col, Select, DatePicker, Button, message, Space } from "antd";
import { 
  UserOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  CalendarOutlined, 
  ThunderboltOutlined
} from "@ant-design/icons";

interface PersonalInfoTabProps {
  form: any;
  submittingProfile: boolean;
  onFinish: (values: any) => void;
  profile?: any;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  form,
  submittingProfile,
  onFinish,
  profile,
}) => {
  const handleSyncFromCv = () => {
    if (!profile) return;
    
    // Auto-fill values parsed from default CV
    form.setFieldsValue({
      fullName: profile.fullName || "",
      phone: profile.extractedPhone || profile.phone || "",
      address: profile.address || ""
    });

    message.success({
      content: "⚡ Đồng bộ dữ liệu từ CV mẫu thành công! Nhấn 'Lưu thông tin cá nhân' để cập nhật.",
      duration: 4
    });
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Main Profile Info Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 700 }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: "#475569" }}>Họ và tên</span>}
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên của bạn!" }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: "#94A3B8" }} />} 
                placeholder="Nguyễn Văn A" 
                style={{ borderRadius: 8, height: 40 }} 
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: "#475569" }}>Số điện thoại</span>}
              name="phone"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
            >
              <Input 
                prefix={<PhoneOutlined style={{ color: "#94A3B8" }} />} 
                placeholder="0987654321" 
                style={{ borderRadius: 8, height: 40 }} 
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: "#475569" }}>Giới tính</span>}
              name="gender"
              rules={[{ required: true }]}
            >
              <Select style={{ borderRadius: 8, height: 40 }}>
                <Select.Option value="Nam">Nam</Select.Option>
                <Select.Option value="Nữ">Nữ</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={<span style={{ fontWeight: 600, color: "#475569" }}>Ngày sinh</span>}
              name="dob"
            >
              <DatePicker 
                prefix={<CalendarOutlined style={{ color: "#94A3B8", marginRight: 4 }} />} 
                style={{ width: "100%", borderRadius: 8, height: 40 }} 
                format="DD/MM/YYYY" 
                placeholder="Chọn ngày sinh" 
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={<span style={{ fontWeight: 600, color: "#475569" }}>Địa chỉ hiện tại</span>}
          name="address"
        >
          <Input.TextArea 
            placeholder="Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội" 
            autoSize={{ minRows: 2, maxRows: 4 }} 
            style={{ borderRadius: 8 }} 
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingProfile}
              style={{ borderRadius: 8, height: 40, background: "#2563EB", fontWeight: 600 }}
            >
              Lưu thông tin cá nhân
            </Button>
            {profile?.defaultCvUrl && (
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleSyncFromCv}
                style={{ borderRadius: 8, height: 40 }}
              >
                Đồng bộ nhanh từ CV
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};
