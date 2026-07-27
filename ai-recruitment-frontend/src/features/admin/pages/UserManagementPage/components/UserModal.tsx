import React from "react";
import { Modal, Form, Input, Select, type FormInstance } from "antd";

interface UserModalProps {
  open: boolean;
  editingUser: any | null;
  branches: any[];
  form: FormInstance;
  onSave: () => void;
  onCancel: () => void;
}

export function UserModal({
  open,
  editingUser,
  branches,
  form,
  onSave,
  onCancel,
}: UserModalProps) {
  return (
    <Modal
      title={editingUser ? "Cập nhật thông tin tài khoản" : "Tạo tài khoản HR mới"}
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      okText="Lưu thông tin"
      cancelText="Hủy bỏ"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
        <Form.Item
          label="Họ và tên"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input placeholder="Nhập họ và tên..." />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: "email", message: "Vui lòng nhập email hợp lệ" }]}
        >
          <Input placeholder="Nhập địa chỉ email..." disabled={!!editingUser} />
        </Form.Item>
        {!editingUser && (
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu..." />
          </Form.Item>
        )}
        <Form.Item
          label="Vai trò"
          name="role"
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          <Select placeholder="Chọn vai trò" disabled={!!editingUser}>
            <Select.Option value="Admin">Quản trị viên (Admin)</Select.Option>
            <Select.Option value="Recruiter">Nhà tuyển dụng (HR)</Select.Option>
            <Select.Option value="Candidate">Ứng viên (Candidate)</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
        >
          {({ getFieldValue }) =>
            getFieldValue("role") === "Recruiter" ? (
              <Form.Item
                label="Chi nhánh phụ trách (Có thể chọn nhiều)"
                name="branches"
                rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 chi nhánh" }]}
              >
                <Select mode="multiple" placeholder="Chọn chi nhánh">
                  {branches
                    .filter((b) => b.isActive)
                    .map((b) => (
                      <Select.Option key={b.id} value={b.id}>
                        {b.name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </Form>
    </Modal>
  );
}
