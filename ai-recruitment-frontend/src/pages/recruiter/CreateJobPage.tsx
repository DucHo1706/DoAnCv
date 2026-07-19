import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Cascader,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import { jobService, jobPositionService, branchService } from "../../services/jobService";
import axiosClient from "../../services/axiosClient";
import type {
  BranchDto,
  CategoryDto,
  CreateJobPayload,
  JobPositionDto,
} from "../../services/jobService";

function CreateJobPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Dropdown data từ API
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [positions, setPositions] = useState<JobPositionDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [jobLevels, setJobLevels] = useState<any[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // ── Fetch dropdown data khi vào trang ──────────
  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true);
      const [posData, branchData, cateData, levelData] = await Promise.all([
        jobPositionService.getJobPositions(),
        branchService.getBranches(),
        axiosClient.get("/Metadata/categories").then((res) => res.data),
        axiosClient.get("/Metadata/job-levels").then((res) => res.data),
      ]);
      setPositions(posData);
      setBranches(branchData);
      setCategories(Array.isArray(cateData) ? cateData : cateData?.$values || []);
      setJobLevels(Array.isArray(levelData) ? levelData : levelData?.$values || []);
    } catch {
      message.error("Không tải được dữ liệu cần thiết cho form");
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Hàm xây dựng dữ liệu cho Cascader (Lĩnh vực & Cấp bậc)
  const buildCascaderData = (items: any[], parentId: string | null = null): any[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const children = buildCascaderData(items, item.id);
        return {
          value: item.id,
          label: item.name,
          children: children.length > 0 ? children : undefined,
        };
      });
  };

  const categoryOptions = useMemo(() => buildCascaderData(categories), [categories]);
  const jobLevelOptions = useMemo(() => buildCascaderData(jobLevels), [jobLevels]);

  // Theo dõi sự thay đổi của Lĩnh vực để lọc Vị trí
  const selectedCategoryPath = Form.useWatch("categoryPath", form);
  const selectedCategoryId =
    selectedCategoryPath && selectedCategoryPath.length > 0
      ? selectedCategoryPath[selectedCategoryPath.length - 1]
      : null;

  // Danh sách vị trí tự động thay đổi dựa theo Lĩnh vực HR chọn
  const filteredPositions = useMemo(() => {
    let filtered = positions.filter((p: any) => p.isActive);
    if (selectedCategoryId) {
      filtered = filtered.filter((p: any) => p.categoryId === selectedCategoryId);
    }
    return filtered;
  }, [positions, selectedCategoryId]);

  // ── Tạo tin tuyển dụng ────────────────────────────────
  const handleCreateJob = async (values: any) => {
    try {
      const payload: CreateJobPayload = {
        positionId: values.positionId,
        branchId: values.branchId,
        categoryId: values.categoryPath
          ? values.categoryPath[values.categoryPath.length - 1]
          : null,
        jobLevelId: values.jobLevelPath
          ? values.jobLevelPath[values.jobLevelPath.length - 1]
          : null,
        description: values.description,
        requirements: values.requirements,
        salaryRange: values.salaryRange,
        startDate: values.startDate ? dayjs(values.startDate).toISOString() : null,
        deadline: values.deadline ? dayjs(values.deadline).toISOString() : null,
        maxCandidates: values.maxCandidates ?? null,
        criteria: values.criteria,
      };

      setSubmitting(true);
      await jobService.createJob(payload as any);
      message.success("Tạo tin tuyển dụng thành công, bài đang chờ duyệt");
      navigate("/recruiter/jobs");
    } catch (error: any) {
      if (error?.response) {
        const msg =
          error.response.data?.message || error.response.data || "Tạo tin tuyển dụng thất bại";
        message.error(typeof msg === "string" ? msg : "Tạo tin tuyển dụng thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Tạo tin tuyển dụng mới"
      subtitle="Điền đầy đủ các thông tin bên dưới để đăng một vị trí tuyển dụng mới."
    >
      <Form form={form} layout="vertical" onFinish={handleCreateJob}>
        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Lĩnh vực & Chuyên ngành"
                name="categoryPath"
                rules={[{ required: true, message: "Vui lòng chọn lĩnh vực" }]}
              >
                <Cascader
                  options={categoryOptions}
                  placeholder="Ví dụ: Công nghệ thông tin > Khoa học máy tính"
                  changeOnSelect
                  loading={dropdownLoading}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Cấp bậc (Level)"
                name="jobLevelPath"
                rules={[{ required: true, message: "Vui lòng chọn cấp bậc" }]}
              >
                <Cascader
                  options={jobLevelOptions}
                  placeholder="Ví dụ: Chuyên viên > Junior"
                  changeOnSelect
                  loading={dropdownLoading}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Vị trí tuyển dụng"
            name="positionId"
            rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}
            tooltip="Bạn phải chọn Lĩnh vực trước, danh sách vị trí sẽ hiển thị tương ứng."
          >
            <Select
              placeholder="Chọn vị trí tuyển dụng"
              showSearch
              loading={dropdownLoading}
              disabled={!selectedCategoryId}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={filteredPositions.map((p: any) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item
            label="Địa điểm"
            name="branchId"
            rules={[{ required: true, message: "Vui lòng chọn chi nhánh" }]}
          >
            <Select
              placeholder="Chọn chi nhánh làm việc"
              loading={dropdownLoading}
              options={branches
                .filter((b) => b.isActive)
                .map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>

          <Form.Item
            label="Mức lương"
            name="salaryRange"
            rules={[{ required: true, message: "Vui lòng nhập mức lương" }]}
          >
            <Input placeholder="Ví dụ: 15 triệu, 15 - 25 triệu, hoặc Thỏa thuận" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày bắt đầu nhận CV" name="startDate">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày bắt đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hạn chót nộp CV" name="deadline">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn hạn chót"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Số lượng cần tuyển" name="maxCandidates">
            <InputNumber style={{ width: "100%" }} min={1} placeholder="Ví dụ: 5" />
          </Form.Item>
          <Form.Item
            label="Mô tả công việc"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả công việc" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả công việc..." />
          </Form.Item>
          <Form.Item
            label="Yêu cầu"
            name="requirements"
            rules={[{ required: true, message: "Vui lòng nhập yêu cầu" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập yêu cầu công việc..." />
          </Form.Item>

          <Divider orientation={"left" as any}>Tiêu chí đánh giá (AI sẽ dựa vào đây để chấm điểm)</Divider>
          <Form.List
            name="criteria"
            initialValue={[
              { name: "Kinh nghiệm chuyên môn", weight: 40 },
              { name: "Kỹ năng công nghệ", weight: 40 },
              { name: "Kỹ năng mềm", weight: 20 },
            ]}
            rules={[
              {
                validator: async (_, criteria) => {
                  if (!criteria || criteria.length === 0) {
                    return Promise.reject(new Error("Vui lòng thêm ít nhất 1 tiêu chí"));
                  }
                  const totalWeight = criteria.reduce(
                    (sum: number, c: any) => sum + (c?.weight || 0),
                    0
                  );
                  if (totalWeight !== 100) {
                    return Promise.reject(
                      new Error(`Tổng trọng số phải bằng 100% (Hiện tại đang là: ${totalWeight}%)`)
                    );
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[{ required: true, message: "Nhập tên tiêu chí" }]}
                    >
                      <Input placeholder="Tên tiêu chí (VD: Tiếng Anh)" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "weight"]}
                      rules={[{ required: true, message: "Nhập trọng số" }]}
                    >
                      <InputNumber
                        placeholder="Trọng số"
                        min={1}
                        max={100}
                        style={{ width: 140 }}
                        addonAfter="%"
                      />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      />
                    ) : null}
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm tiêu chí
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>

        <Card style={{ marginTop: 24, position: "sticky", bottom: 0, zIndex: 10 }}>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
              Gửi duyệt tin
            </Button>
            <Button onClick={() => navigate("/recruiter/jobs")}>Hủy</Button>
          </Space>
        </Card>
      </Form>
    </PageContainer>
  );
}

export default CreateJobPage;
