import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Radio,
  Spin,
  Alert,
  Drawer,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
} from "antd";
import {
  CalendarOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import { recruitmentService, type InterviewScheduleDto } from "../../../../services/recruitmentService";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useNavigate } from "react-router-dom";

dayjs.locale("vi");

const { Text, Paragraph, Title } = Typography;

interface EnrichedScheduleDto extends InterviewScheduleDto {
  candidateName?: string;
  jobTitle?: string;
  aiScore?: number;
  classification?: string;
  recipientEmail?: string;
}

export default function InterviewSchedulePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<EnrichedScheduleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentWeekDate, setCurrentWeekDate] = useState<dayjs.Dayjs>(dayjs());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSchedules, setDrawerSchedules] = useState<EnrichedScheduleDto[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

  // Edit schedule states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<EnrichedScheduleDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data: any = await recruitmentService.getHrInterviewSchedules();
      const list = data?.$values || data || [];
      setSchedules(list);
    } catch (error) {
      console.error("Lỗi khi tải danh sách lịch phỏng vấn:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Calculate Monday to Sunday of the selected week
  const weekDays = useMemo(() => {
    const dayIndex = currentWeekDate.day();
    const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
    const monday = currentWeekDate.add(diffToMonday, "day");

    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(monday.add(i, "day"));
    }
    return days;
  }, [currentWeekDate]);

  const handlePrevWeek = () => {
    setCurrentWeekDate((prev) => prev.subtract(1, "week"));
  };

  const handleNextWeek = () => {
    setCurrentWeekDate((prev) => prev.add(1, "week"));
  };

  const handleCurrentWeek = () => {
    setCurrentWeekDate(dayjs());
  };

  const getSchedulesForDate = (date: dayjs.Dayjs) => {
    return schedules.filter((s) => dayjs(s.interviewDate).isSame(date, "day"));
  };

  const getDayNameText = (index: number) => {
    if (index === 6) return "Chủ nhật";
    return `Thứ ${index + 2}`;
  };

  const handleOpenEditModal = (item: EnrichedScheduleDto) => {
    setSelectedSchedule(item);
    form.setFieldsValue({
      interviewDate: item.interviewDate ? dayjs(item.interviewDate) : null,
      format: item.format || "Online",
      locationOrLink: item.locationOrLink || "",
      meetingId: item.meetingId || "",
      passcode: item.passcode || "",
      notes: item.notes || "",
    });
    setEditModalOpen(true);
  };

  const handleCancelSchedule = (appId?: string) => {
    if (!appId) return;
    Modal.confirm({
      title: "Xác nhận hủy lịch phỏng vấn",
      content: "Đơn ứng tuyển sẽ được đưa về trạng thái 'HR đang xem xét' và lịch hẹn này sẽ bị xóa. Bạn có chắc chắn muốn hủy?",
      okText: "Xác nhận hủy",
      okType: "danger",
      cancelText: "Hủy bỏ",
      onOk: async () => {
        try {
          await recruitmentService.cancelInterview(appId);
          message.success("Đã hủy lịch phỏng vấn thành công.");
          setDrawerOpen(false);
          fetchSchedules();
        } catch (error) {
          message.error("Lỗi khi hủy lịch phỏng vấn.");
        }
      },
    });
  };

  const handleConfirmEdit = async (values: any) => {
    if (!selectedSchedule || !selectedSchedule.applicationId) return;
    try {
      setSubmitting(true);
      const res = await recruitmentService.scheduleInterview(selectedSchedule.applicationId, values);
      message.success("Cập nhật lịch phỏng vấn thành công. Đang chuyển hướng sang trang soạn email...");
      setEditModalOpen(false);
      setDrawerOpen(false);

      const dateStr = dayjs(values.interviewDate).format("DD/MM/YYYY HH:mm");
      const emailContext = `Cập nhật lịch phỏng vấn mới vào lúc ${dateStr}. Hình thức: ${values.format === "Online" ? "Trực tuyến (Online)" : "Trực tiếp tại văn phòng"}. Địa điểm/Đường dẫn: ${values.locationOrLink}. ${values.notes ? `Ghi chú thêm: ${values.notes}` : ""}`;

      navigate(`/recruiter/candidates/${selectedSchedule.applicationId}/email`, {
        state: {
          source: "interview-schedule",
          emailType: "invite",
          emailContext,
          candidate: {
            id: selectedSchedule.applicationId,
            candidateId: selectedSchedule.applicationId,
            candidateName: selectedSchedule.candidateName,
            fullName: selectedSchedule.candidateName,
            jobTitle: selectedSchedule.jobTitle,
            aiScore: selectedSchedule.aiScore || 0,
            classification: selectedSchedule.classification || "Đạt yêu cầu",
            aiReason: selectedSchedule.notes || "",
            matchedSkills: [],
            missingSkills: [],
            cvEmail: selectedSchedule.recipientEmail || "", // Fallback or retrieve from list
            accountEmail: selectedSchedule.recipientEmail || "",
            schedule: res.data?.schedule || {
              interviewDate: values.interviewDate,
              format: values.format,
              locationOrLink: values.locationOrLink,
            }
          }
        }
      });
    } catch (error) {
      message.error("Lỗi khi cập nhật lịch phỏng vấn.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDrawerForDate = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setDrawerSchedules(getSchedulesForDate(date));
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 200,
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: "#3B82F6" }} />
          <Text strong>{text || "Chưa rõ"}</Text>
        </Space>
      ),
    },
    {
      title: "Vị trí tuyển dụng",
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 220,
      render: (text: string) => <Text style={{ color: "#334155" }}>{text || "Chưa rõ"}</Text>,
    },
    {
      title: "Thời gian",
      dataIndex: "interviewDate",
      key: "interviewDate",
      width: 180,
      render: (dateStr: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: "#64748B" }} />
          <Text>{dayjs(dateStr).format("DD/MM/YYYY HH:mm")}</Text>
        </Space>
      ),
    },
    {
      title: "Hình thức",
      dataIndex: "format",
      key: "format",
      width: 140,
      render: (format: string) => (
        <Tag color={format === "Online" ? "blue" : "purple"} style={{ fontWeight: 600 }}>
          {format === "Online" ? "Online" : "Trực tiếp"}
        </Tag>
      ),
    },
    {
      title: "Địa điểm / Link họp",
      dataIndex: "locationOrLink",
      key: "locationOrLink",
      width: 260,
      render: (link: string, record: EnrichedScheduleDto) => {
        if (record.format === "Online") {
          return (
            <Button
              type="link"
              icon={<VideoCameraOutlined />}
              href={link.startsWith("http") ? link : `https://${link}`}
              target="_blank"
              style={{ padding: 0, height: "auto" }}
            >
              Vào phòng họp trực tuyến
            </Button>
          );
        }
        return (
          <Space>
            <EnvironmentOutlined style={{ color: "#EF4444" }} />
            <Text>{link}</Text>
          </Space>
        );
      },
    },
    {
      title: "Ghi chú dặn dò",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      render: (notes: string) => (
        <Text type="secondary" ellipsis style={{ maxWidth: 200, display: "inline-block" }}>
          {notes || "Không có ghi chú"}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      fixed: "right" as const,
      render: (_: any, record: EnrichedScheduleDto) => (
        <Space size="middle">
          <Button
            size="small"
            type="text"
            icon={<EditOutlined style={{ color: "#2563EB" }} />}
            onClick={() => handleOpenEditModal(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleCancelSchedule(record.applicationId)}
          >
            Hủy
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Lịch phỏng vấn ứng viên">
      <div style={{ padding: "8px 0 24px" }}>
        {/* View Mode Toggle */}
        <div style={{ marginBottom: 20 }}>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            size="large"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <Radio.Button value="calendar" style={{ display: "inline-flex", alignItems: "center" }}>
              <CalendarOutlined style={{ marginRight: 6 }} /> Xem dạng Lịch tuần
            </Radio.Button>
            <Radio.Button value="list" style={{ display: "inline-flex", alignItems: "center" }}>
              <UnorderedListOutlined style={{ marginRight: 6 }} /> Xem dạng Danh sách
            </Radio.Button>
          </Radio.Group>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <Spin size="large" tip="Đang tải lịch phỏng vấn..." />
          </div>
        ) : viewMode === "calendar" ? (
          <div>
            {/* Weekly Header Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 60%, #EFF6FF 100%)",
                borderRadius: "16px",
                padding: "24px 32px",
                border: "1px solid #E2E8F0",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div>
                <Title level={3} style={{ color: "#0F172A", margin: 0, fontWeight: 700 }}>
                  Bảng phân công lịch phỏng vấn
                </Title>
                <Text style={{ color: "#64748B", fontSize: 14, display: "block", marginTop: 4 }}>
                  Lịch tuần từ <strong style={{ color: "#2563EB" }}>{weekDays[0].format("DD/MM/YYYY")}</strong> đến <strong style={{ color: "#2563EB" }}>{weekDays[6].format("DD/MM/YYYY")}</strong>
                </Text>
              </div>

              <Space size="middle">
                <Button
                  onClick={handlePrevWeek}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#475569",
                    borderColor: "#E2E8F0",
                    height: 40,
                  }}
                >
                  ← Tuần trước
                </Button>
                <Button
                  type="primary"
                  onClick={handleCurrentWeek}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 40,
                  }}
                >
                  Tuần này
                </Button>
                <Button
                  onClick={handleNextWeek}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#475569",
                    borderColor: "#E2E8F0",
                    height: 40,
                  }}
                >
                  Tuần sau →
                </Button>
              </Space>
            </div>

            {/* 7-Day Columns Layout */}
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 16,
                minHeight: 520,
              }}
            >
              {weekDays.map((day, idx) => {
                const isToday = day.isSame(dayjs(), "day");
                const daySchedules = getSchedulesForDate(day);

                return (
                  <div
                    key={day.toString()}
                    style={{
                      flex: 1,
                      minWidth: 175,
                      display: "flex",
                      flexDirection: "column",
                      background: "#FFFFFF",
                      borderRadius: 12,
                      border: isToday ? "2px solid #2563EB" : "1px solid #E2E8F0",
                      overflow: "hidden",
                      boxShadow: isToday ? "0 8px 30px rgba(37, 99, 235, 0.12)" : "0 4px 12px rgba(0,0,0,0.02)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Header of Column - Highlighted if Today */}
                    <div
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        background: isToday ? "#2563EB" : "#F8FAFC",
                        color: isToday ? "#FFFFFF" : "#0F172A",
                        borderBottom: isToday ? "2px solid #2563EB" : "1px solid #E2E8F0",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Text strong style={{ color: isToday ? "#FFFFFF" : "#0F172A", fontSize: 15 }}>
                        {getDayNameText(idx)}
                      </Text>
                      <Text style={{ color: isToday ? "rgba(255,255,255,0.85)" : "#64748B", fontSize: 12 }}>
                        {day.format("DD/MM/YYYY")}
                      </Text>
                    </div>

                    {/* Body of Column - Contains schedules */}
                    <div
                      style={{
                        padding: 8,
                        flex: 1,
                        background: isToday ? "rgba(37, 99, 235, 0.01)" : "#FCFDFE",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        minHeight: 440,
                      }}
                    >
                      {daySchedules.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "24px 8px",
                            background: "#FFFFFF",
                            borderRadius: 8,
                            border: "1px dashed #CBD5E1",
                            color: "#94A3B8",
                            fontSize: 13,
                          }}
                        >
                          Trống lịch hẹn
                        </div>
                      ) : (
                        daySchedules.map((item) => (
                          <Card
                            key={item.scheduleId}
                            size="small"
                            style={{
                              borderRadius: 8,
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                              background: "#FFFFFF",
                            }}
                            bodyStyle={{ padding: 10 }}
                          >
                            <Text strong style={{ display: "block", fontSize: 13, color: "#0F172A" }} ellipsis>
                              {item.candidateName}
                            </Text>
                            <Text type="secondary" style={{ display: "block", fontSize: 11, marginTop: 2 }} ellipsis>
                              {item.jobTitle}
                            </Text>
                            
                            <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Tag color={item.format === "Online" ? "blue" : "purple"} style={{ fontSize: 10, margin: 0 }}>
                                {item.format}
                              </Tag>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>
                                {dayjs(item.interviewDate).format("HH:mm")}
                              </span>
                            </div>

                            {/* Actions strip */}
                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderTop: "1px solid #F1F5F9",
                                paddingTop: 6,
                              }}
                            >
                              <Button
                                size="small"
                                type="link"
                                onClick={() => handleOpenDrawerForDate(day)}
                                style={{ padding: 0, fontSize: 11 }}
                              >
                                Chi tiết
                              </Button>
                              <Space size={2}>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<EditOutlined style={{ fontSize: 12, color: "#2563EB" }} />}
                                  onClick={() => handleOpenEditModal(item)}
                                />
                                <Button
                                  size="small"
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                                  onClick={() => handleCancelSchedule(item.applicationId)}
                                />
                              </Space>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List Mode Table View */
          <Card
            style={{
              borderRadius: "16px",
              boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.04)",
              border: "1px solid #E2E8F0",
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={schedules}
              columns={columns}
              rowKey="scheduleId"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1300 }}
              locale={{
                emptyText: <Empty description="Chưa có lịch phỏng vấn nào được thiết lập" />,
              }}
            />
          </Card>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer
        title={`Chi tiết lịch phỏng vấn ngày: ${selectedDate.format("DD/MM/YYYY")}`}
        placement="right"
        width={500}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        destroyOnClose
      >
        {drawerSchedules.length === 0 ? (
          <Empty description="Không có ca phỏng vấn nào trong ngày này" style={{ marginTop: 60 }} />
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {drawerSchedules.map((item) => (
              <Card
                key={item.scheduleId}
                title={
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {item.candidateName}
                    </Text>
                    <Tag color={item.format === "Online" ? "blue" : "purple"}>
                      {item.format === "Online" ? "Online" : "Tại văn phòng"}
                    </Tag>
                  </Space>
                }
                style={{
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(148,163,184,0.06)",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                      VỊ TRÍ TUYỂN DỤNG
                    </Text>
                    <Text strong style={{ fontSize: 14 }}>
                      {item.jobTitle}
                    </Text>
                  </div>

                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                      GIỜ PHỎNG VẤN
                    </Text>
                    <Space>
                      <ClockCircleOutlined style={{ color: "#2563EB" }} />
                      <Text style={{ fontSize: 14, fontWeight: 600 }}>
                        {dayjs(item.interviewDate).format("HH:mm")} (Ngày{" "}
                        {dayjs(item.interviewDate).format("DD/MM/YYYY")})
                      </Text>
                    </Space>
                  </div>

                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                      ĐỊA ĐIỂM / LINK HỌP
                    </Text>
                    {item.format === "Online" ? (
                      <div style={{ marginTop: 4 }}>
                        <Button
                          type="primary"
                          icon={<VideoCameraOutlined />}
                          href={item.locationOrLink.startsWith("http") ? item.locationOrLink : `https://${item.locationOrLink}`}
                          target="_blank"
                          style={{ backgroundColor: "#2563EB", borderColor: "#2563EB", borderRadius: 8 }}
                        >
                          Vào phòng Google Meet/Zoom
                        </Button>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Link: {item.locationOrLink}
                          </Text>
                        </div>
                      </div>
                    ) : (
                      <Space>
                        <EnvironmentOutlined style={{ color: "#EF4444" }} />
                        <Text style={{ fontSize: 14 }}>{item.locationOrLink}</Text>
                      </Space>
                    )}
                  </div>

                  {item.meetingId && (
                    <div>
                      <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        MÃ PHÒNG HỌP & MẬT KHẨU
                      </Text>
                      <Text code>ID: {item.meetingId}</Text>
                      {item.passcode && <Text code style={{ marginLeft: 8 }}>Mật mã: {item.passcode}</Text>}
                    </div>
                  )}

                  {item.notes && (
                    <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 2 }}>
                        LỜI DẶN DÒ CỦA HR:
                      </Text>
                      <Paragraph style={{ margin: 0, fontStyle: "italic" }}>{item.notes}</Paragraph>
                    </div>
                  )}

                  {/* Edit and Delete Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #E2E8F0", paddingTop: 16, marginTop: 8 }}>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleCancelSchedule(item.applicationId)}
                    >
                      Hủy lịch
                    </Button>
                    <Button
                      type="default"
                      icon={<EditOutlined style={{ color: "#2563EB" }} />}
                      onClick={() => handleOpenEditModal(item)}
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Drawer>

      <Modal
        title="Chỉnh sửa lịch phỏng vấn & Gửi Email"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleConfirmEdit}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong>Ứng viên: </Text>
            <Text>{selectedSchedule?.candidateName}</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Vị trí ứng tuyển: </Text>
            <Text>{selectedSchedule?.jobTitle}</Text>
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
            message="Hệ thống sẽ dùng AI tự động soạn thảo lại email mời phỏng vấn cập nhật gửi trực tiếp tới ứng viên."
            style={{ marginBottom: 20 }}
          />

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setEditModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: "#2563EB" }}>
                Xác nhận cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
