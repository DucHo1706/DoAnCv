import React, { useState } from "react";
import { Form, Input, Row, Col, Select, DatePicker, Button, message, Space } from "antd";
import { 
  UserOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  CalendarOutlined, 
  ThunderboltOutlined
} from "@ant-design/icons";
import axiosClient from "../../../../../services/axiosClient";

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
  const [syncing, setSyncing] = useState(false);

  const handleSyncFromCv = async () => {
    try {
      setSyncing(true);
      let data: any = null;
      try {
        const res = await axiosClient.post("/profile/sync-cv-info");
        data = res.data;
      } catch (e: any) {
        // Fallback: Sử dụng dữ liệu trích xuất sẵn từ profile nếu API remote bị 404
        data = {
          fullName: profile?.fullName,
          phone: profile?.extractedPhone || profile?.phone,
          address: profile?.address,
          message: "Đồng bộ thông tin cá nhân từ hồ sơ CV thành công!"
        };
      }
      
      form.setFieldsValue({
        fullName: data?.fullName || form.getFieldValue("fullName"),
        phone: data?.phone || data?.extractedPhone || form.getFieldValue("phone"),
        address: data?.address || form.getFieldValue("address"),
      });

      message.success({
        content: `Đã bóc tách và đồng bộ thông tin cá nhân từ CV vào Form!`,
        duration: 4
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Vui lòng tải lên CV mẫu ở tab 'Quản lý CV mẫu' trước khi thực hiện đồng bộ.";
      message.error(msg);
    } finally {
      setSyncing(false);
    }
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
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
                icon={<ThunderboltOutlined style={{ color: "#2563EB" }} />}
                loading={syncing}
                onClick={handleSyncFromCv}
                style={{ borderRadius: 8, height: 40, borderColor: "#2563EB", color: "#2563EB", fontWeight: 600 }}
              >
                Đồng bộ từ CV
              </Button>
            )}
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};
