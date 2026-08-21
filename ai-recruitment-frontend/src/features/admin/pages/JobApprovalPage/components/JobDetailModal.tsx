import React from "react";
import {
  Modal,
  Button,
  Tag,
  Typography,
  Space,
  Descriptions,
  Divider,
  Table,
} from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { JobReviewResponse } from "../../../../recruiter/services/jobService";
import { formatJobDate, resolveJobLifecycle } from "../../../../../utils/jobLifecycle";

const { Text, Paragraph } = Typography;

function formatDate(value?: string | null) {
  return formatJobDate(value);
}

interface JobDetailModalProps {
  open: boolean;
  loading: boolean;
  jobDetail: JobReviewResponse | null;
  approvingId: string | null;
  onCancel: () => void;
  onOpenReject: (item: any) => void;
  onApprove: (item: any) => void;
}

export function JobDetailModal({
  open,
  loading,
  jobDetail,
  approvingId,
  onCancel,
  onOpenReject,
  onApprove,
}: JobDetailModalProps) {
  const getJobItemObj = (info: any) => ({
    id: info.id,
    title: info.position?.name || "Chưa cập nhật",
    location: info.branch?.name || "Chưa cập nhật",
    salaryRange: info.salaryRange,
    createdAt: info.createdAt,
    deadline: info.deadline,
    recruiterName: info.recruiter?.name || "HR Mặc định",
    recruiterEmail: info.recruiter?.email || "hr@system.com",
    raw: info,
  });

  return (
    <Modal
      title="Chi tiết tin tuyển dụng"
      open={open}
      onCancel={onCancel}
      footer={
        jobDetail && jobDetail.jobInfo.status === "Pending"
          ? [
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                disabled={approvingId !== null}
                onClick={() => onOpenReject(getJobItemObj(jobDetail.jobInfo))}
              >
                Từ chối
              </Button>,
              <Button
                key="approve"
                type="primary"
                icon={<CheckOutlined />}
                loading={approvingId === jobDetail.jobInfo.id}
                disabled={approvingId !== null}
                onClick={() => onApprove(getJobItemObj(jobDetail.jobInfo))}
                style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
              >
                Duyệt tin tuyển dụng
              </Button>,
            ]
          : null
      }
      width={820}
    >
      {loading && <Text type="secondary">Đang tải dữ liệu...</Text>}

      {jobDetail && (
        <>
          <Space style={{ marginBottom: 16 }}>
            {resolveJobLifecycle(jobDetail.jobInfo) === "Expired" ? (
              <Tag color="error">Đã duyệt · Hết hạn</Tag>
            ) : resolveJobLifecycle(jobDetail.jobInfo) === "Scheduled" ? (
              <Tag color="processing">Đã duyệt · Sắp mở</Tag>
            ) : resolveJobLifecycle(jobDetail.jobInfo) === "Recruiting" ? (
              <Tag color="success">Đang tuyển</Tag>
            ) : resolveJobLifecycle(jobDetail.jobInfo) === "Closed" ? (
              <Tag color="default">Đã đóng</Tag>
            ) : jobDetail.jobInfo.status === "Rejected" ? (
              <Tag color="error" style={{ fontWeight: 700 }}>
                Đã từ chối
              </Tag>
            ) : (
              <Tag
                color="warning"
                style={{ backgroundColor: "#FFF7ED", borderColor: "#FFEDD5", color: "#C2410C", fontWeight: 700 }}
              >
                Chờ duyệt
              </Tag>
            )}
            <Text type="secondary">Tạo lúc: {formatDate(jobDetail.jobInfo.createdAt)}</Text>
          </Space>

          {jobDetail.jobInfo.status === "Rejected" && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
              }}
            >
              <Text strong style={{ color: "#EF4444" }}>
                Lý do từ chối:{" "}
              </Text>
              <Text style={{ color: "#991B1B" }}>
                {jobDetail.jobInfo.rejectReason || "Không có lý do cụ thể"}
              </Text>
            </div>
          )}

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="Vị trí tuyển dụng" span={2}>
              <Text strong style={{ fontSize: 16 }}>
                {jobDetail.jobInfo.position?.name || "Chưa cập nhật"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="HR Đăng tuyển" span={2}>
              <Text strong style={{ color: "#2563EB" }}>
                {jobDetail.jobInfo.recruiter?.name || "HR Mặc định"} (
                {jobDetail.jobInfo.recruiter?.email || "hr@system.com"})
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm Chi nhánh">
              {jobDetail.jobInfo.branch?.name || "Chưa cập nhật"}
            </Descriptions.Item>
            <Descriptions.Item label="Mức lương">
              {jobDetail.jobInfo.salaryRange || "Chưa cập nhật"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">
              {formatDate(jobDetail.jobInfo.startDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Hạn nộp hồ sơ">
              {formatDate(jobDetail.jobInfo.deadline)}
            </Descriptions.Item>
            <Descriptions.Item label="Chỉ tiêu số lượng" span={2}>
              {jobDetail.jobInfo.maxCandidates ?? "Không giới hạn"}
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: "16px 0" }} />

          <div style={{ marginBottom: 16 }}>
            <Text strong>Mô tả công việc</Text>
            <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
              {jobDetail.jobInfo.description || "Chưa có mô tả"}
            </Paragraph>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>Yêu cầu công việc</Text>
            <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
              {jobDetail.jobInfo.requirements || "Chưa có yêu cầu"}
            </Paragraph>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          <div style={{ marginBottom: 16 }}>
            <Text strong>Tiêu chí đánh giá CV do HR thiết lập</Text>
            <Table
              style={{ marginTop: 8 }}
              size="small"
              bordered
              pagination={false}
              rowKey={(record) => record.id || record.name}
              dataSource={jobDetail.jobInfo.criteria || []}
              locale={{ emptyText: "HR chưa thiết lập tiêu chí đánh giá" }}
              columns={[
                {
                  title: "Tiêu chí",
                  dataIndex: "name",
                  key: "name",
                  render: (value: string) => <Text strong>{value}</Text>,
                },
                {
                  title: "Trọng số",
                  dataIndex: "weight",
                  key: "weight",
                  width: 130,
                  align: "center" as const,
                  render: (value: number) => <Tag color="blue">{value}%</Tag>,
                },
              ]}
              summary={(data) => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><Text strong>Tổng trọng số</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Text strong>{data.reduce((sum, item) => sum + Number(item.weight || 0), 0)}%</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>

        </>
      )}
    </Modal>
  );
}
