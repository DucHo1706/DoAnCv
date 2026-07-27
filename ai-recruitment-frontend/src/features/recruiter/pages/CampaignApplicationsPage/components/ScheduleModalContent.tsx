import React, { useEffect } from "react";
import { Form, DatePicker, Select, Input, Alert, Space, Button, Typography } from "antd";
import dayjs from "dayjs";
import { recruitmentService, type ApplicationDto } from "../../../services/recruitmentService";

const { Text } = Typography;

interface ScheduleModalContentProps {
  application: ApplicationDto | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (values: any) => Promise<void>;
}

export function ScheduleModalContent({
  application,
  submitting,
  onCancel,
  onConfirm,
}: ScheduleModalContentProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (application && application.status === "Interview") {
      const loadExistingSchedule = async () => {
        try {
          const scheduleData = await recruitmentService.getInterviewSchedule(application.id);
          if (scheduleData) {
            form.setFieldsValue({
              interviewDate: scheduleData.interviewDate ? dayjs(scheduleData.interviewDate) : null,
              format: scheduleData.format || "Online",
              locationOrLink: scheduleData.locationOrLink || "",
              meetingId: scheduleData.meetingId || "",
              passcode: scheduleData.passcode || "",
              notes: scheduleData.notes || "",
            });
          }
        } catch (error) {
          console.error("Lỗi khi tải lịch phỏng vấn cũ:", error);
        }
      };
      loadExistingSchedule();
    } else {
      form.resetFields();
    }
  }, [application, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onConfirm}
      initialValues={{
        format: "Online",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Ứng viên: </Text>
        <Text>{application?.candidateName}</Text>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong>Vị trí ứng tuyển: </Text>
        <Text>{application?.jobTitle}</Text>
      </div>

      <Form.Item
        label="Thời gian phỏng vấn"
        name="interviewDate"
        rules={[{ required: true, message: "Vui lòng chọn thời gian phỏng vấn!" }]}
      >
        <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Hình thức phỏng vấn"
        name="format"
        rules={[{ required: true, message: "Vui lòng chọn hình thức!" }]}
      >
        <Select
          options={[
            { value: "Online", label: "Trực tuyến (Google Meet/Zoom)" },
            { value: "Offline", label: "Trực tiếp tại văn phòng" },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Địa điểm hoặc Đường dẫn phòng họp"
        name="locationOrLink"
        rules={[{ required: true, message: "Vui lòng nhập địa điểm hoặc link cuộc họp!" }]}
      >
        <Input placeholder="Nhập địa chỉ văn phòng hoặc link Zoom/Meet..." />
      </Form.Item>

      <Form.Item label="Meeting ID (nếu có)" name="meetingId">
        <Input placeholder="Nhập Meeting ID..." />
      </Form.Item>

      <Form.Item label="Mật khẩu phòng họp (nếu có)" name="passcode">
        <Input placeholder="Nhập mật khẩu..." />
      </Form.Item>

      <Form.Item label="Ghi chú dặn dò ứng viên" name="notes">
        <Input.TextArea rows={3} placeholder="Nhập các dặn dò như chuẩn bị laptop, trang phục..." />
      </Form.Item>

      <Alert
        type="info"
        showIcon
        message="Hệ thống sẽ tự động dùng AI soạn thư mời phỏng vấn chứa thông tin cuộc hẹn và gửi trực tiếp tới email ứng viên."
        style={{ marginBottom: 20 }}
      />

      <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            style={{ backgroundColor: "#2563EB" }}
          >
            Xác nhận & Gửi Email
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
