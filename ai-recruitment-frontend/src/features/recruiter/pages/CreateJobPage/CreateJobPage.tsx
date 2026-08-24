import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Cascader,
  Col,
  Collapse,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import { jobService, jobPositionService, branchService } from "../../services/jobService";
import axiosClient from "../../../../services/axiosClient";
import type {
  BranchDto,
  CategoryDto,
  JobPositionDto,
} from "../../services/jobService";
import { useRealtimeResourceRefresh } from "../../../../hooks/useRealtimeRefresh";

interface CriterionGroupDto {
  id: string;
  name: string;
  evaluationMode: string;
  description?: string | null;
}

const DEFAULT_CRITERION_GROUPS: CriterionGroupDto[] = [
  { id: "criterion-skill", name: "Kỹ năng", evaluationMode: "SKILL" },
  { id: "criterion-total-experience", name: "Tổng kinh nghiệm liên quan", evaluationMode: "TOTAL_EXPERIENCE" },
  { id: "criterion-custom", name: "Tiêu chí riêng", evaluationMode: "CUSTOM" },
];

function CreateJobPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id: editingJobId, repostSourceId } = useParams<{
    id?: string;
    repostSourceId?: string;
  }>();
  const isEditing = Boolean(editingJobId);
  const isReposting = Boolean(repostSourceId);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown data từ API
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [positions, setPositions] = useState<JobPositionDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [jobLevels, setJobLevels] = useState<any[]>([]);
  const [criterionGroups, setCriterionGroups] = useState<CriterionGroupDto[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const formReadyRef = useRef(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = isReposting
    ? `recruitinsight:job-draft:repost:${repostSourceId}`
    : `recruitinsight:job-draft:${editingJobId || "new"}`;

  // ── Fetch dropdown data khi vào trang ──────────
  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true);
      const [posData, branchData, cateData, levelData, criterionGroupData] = await Promise.all([
        jobPositionService.getJobPositions(),
        branchService.getBranches(),
        axiosClient.get("/Metadata/categories").then((res) => res.data),
        axiosClient.get("/Metadata/job-levels").then((res) => res.data),
        axiosClient.get("/Metadata/criterion-groups").then((res) => res.data).catch(() => DEFAULT_CRITERION_GROUPS),
      ]);
      setPositions(posData);
      setBranches(branchData);
      setCategories(Array.isArray(cateData) ? cateData : cateData?.$values || []);
      setJobLevels(Array.isArray(levelData) ? levelData : levelData?.$values || []);
      setCriterionGroups(Array.isArray(criterionGroupData) ? criterionGroupData : criterionGroupData?.$values || DEFAULT_CRITERION_GROUPS);
      const jobIdToLoad = editingJobId || repostSourceId;
      if (jobIdToLoad) {
        const detail = await jobService.getJobReview(jobIdToLoad);
        const job = detail.jobInfo;
        const findPath = (items: any[], targetId?: string | null) => {
          if (!targetId) return undefined;
          const byId = new Map(items.map((item: any) => [item.id, item]));
          const result: string[] = [];
          let current: any = byId.get(targetId);
          while (current) {
            result.unshift(current.id);
            current = current.parentId ? byId.get(current.parentId) : null;
          }
          return result.length ? result : undefined;
        };
        form.setFieldsValue({
          categoryPath: findPath(Array.isArray(cateData) ? cateData : cateData?.$values || [], job.category?.id),
          jobLevelPath: findPath(Array.isArray(levelData) ? levelData : levelData?.$values || [], job.jobLevel?.id),
          positionId: job.position?.id,
          branchId: job.branch?.id,
          salaryRange: job.salaryRange,
          startDate: isReposting
            ? dayjs().startOf("day")
            : job.startDate ? dayjs(job.startDate) : null,
          deadline: isReposting
            ? dayjs().add(30, "day").startOf("day")
            : job.deadline ? dayjs(job.deadline) : null,
          maxCandidates: job.maxCandidates,
          description: job.description,
          requirements: job.requirements,
          criteria: (job.criteria || []).map((criterion, index) => ({
            ...criterion,
            criterionGroupId: criterion.criterionGroupId ||
              (Array.isArray(criterionGroupData) ? criterionGroupData : criterionGroupData?.$values || DEFAULT_CRITERION_GROUPS)
                .find((group: CriterionGroupDto) => group.evaluationMode === (criterion.criterionType || "CUSTOM"))?.id,
            priorityLevel: criterion.priorityLevel || "PREFERRED",
            criterionType: criterion.criterionType || "CUSTOM",
            operator: criterion.operator || "EXISTS",
            targetValue: criterion.targetValue || criterion.name,
            evidenceSources: (criterion.evidenceSources || "SKILLS,EXPERIENCE,PROJECTS")
              .split(",")
              .map((source) => source.trim())
              .filter(Boolean),
            displayOrder: criterion.displayOrder ?? index,
          })),
        });
      }
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.startDate) draft.startDate = dayjs(draft.startDate);
        if (draft.deadline) draft.deadline = dayjs(draft.deadline);
        form.setFieldsValue(draft);
      }
      formReadyRef.current = true;
    } catch {
      message.error("Không tải được dữ liệu cần thiết cho form");
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, [editingJobId, repostSourceId]);

  const refreshMetadata = useCallback(async () => {
    try {
      const [posData, branchData, cateData, levelData, criterionGroupData] = await Promise.all([
        jobPositionService.getJobPositions(),
        branchService.getBranches(),
        axiosClient.get("/Metadata/categories").then((res) => res.data),
        axiosClient.get("/Metadata/job-levels").then((res) => res.data),
        axiosClient.get("/Metadata/criterion-groups").then((res) => res.data).catch(() => DEFAULT_CRITERION_GROUPS),
      ]);
      setPositions(posData);
      setBranches(branchData);
      setCategories(Array.isArray(cateData) ? cateData : cateData?.$values || []);
      setJobLevels(Array.isArray(levelData) ? levelData : levelData?.$values || []);
      setCriterionGroups(Array.isArray(criterionGroupData) ? criterionGroupData : criterionGroupData?.$values || DEFAULT_CRITERION_GROUPS);
    } catch {
      // Giữ danh mục hiện có nếu lần đồng bộ nền thất bại.
    }
  }, []);

  useRealtimeResourceRefresh(
    ["branches", "categories", "job-levels", "job-positions", "criterion-groups"],
    refreshMetadata,
  );

  useEffect(() => {
    const onFocus = () => void refreshMetadata();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshMetadata]);

  const saveDraft = (_changedValues: any, allValues: any) => {
    if (!formReadyRef.current) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({
        ...allValues,
        startDate: allValues.startDate ? dayjs(allValues.startDate).toISOString() : null,
        deadline: allValues.deadline ? dayjs(allValues.deadline).toISOString() : null,
      }));
    }, 350);
  };

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
      const payload: any = {
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
        startDate: values.startDate ? dayjs(values.startDate).format("YYYY-MM-DD") : null,
        deadline: values.deadline ? dayjs(values.deadline).format("YYYY-MM-DD") : null,
        maxCandidates: values.maxCandidates ?? null,
        criteria: values.criteria.map((criterion: any, index: number) => ({
          ...criterion,
          criterionType: criterionGroups.find((group) => group.id === criterion.criterionGroupId)?.evaluationMode || criterion.criterionType || "CUSTOM",
          priorityLevel: criterion.priorityLevel || "PREFERRED",
          operator: criterion.operator || "EXISTS",
          targetValue: criterion.targetValue?.trim() || criterion.name?.trim(),
          minDurationMonths: criterion.minDurationMonths ?? null,
          evidenceSources: Array.isArray(criterion.evidenceSources)
            ? criterion.evidenceSources.join(",")
            : criterion.evidenceSources || "SKILLS,EXPERIENCE,PROJECTS",
          evaluationGuidance: criterion.evaluationGuidance?.trim() || null,
          displayOrder: index,
        })),
      };

      setSubmitting(true);
      if (repostSourceId) {
        const response = await jobService.repostJob(repostSourceId, payload);
        message.success(response?.message || "Đã tạo đợt tuyển dụng mới và gửi duyệt");
        localStorage.removeItem(draftKey);
        navigate(response?.id ? `/recruiter/jobs/${response.id}` : "/recruiter/jobs");
        return;
      } else if (editingJobId) {
        const response = await jobService.updateJob(editingJobId, payload as any);
        message.success(response?.message || "Đã cập nhật và gửi lại tin để duyệt");
      } else {
        const response = await jobService.createJob(payload as any);
        message.success("Tạo tin tuyển dụng thành công, bài đang chờ duyệt");
        localStorage.removeItem(draftKey);
        navigate(response?.id ? `/recruiter/jobs/${response.id}` : "/recruiter/jobs");
        return;
      }
      localStorage.removeItem(draftKey);
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
      title={
        isReposting
          ? "Đăng lại tin tuyển dụng"
          : isEditing ? "Chỉnh sửa tin tuyển dụng" : "Tạo tin tuyển dụng mới"
      }
      subtitle={isEditing ? "Nội dung thay đổi sẽ được gửi lại để quản trị viên duyệt." : undefined}
    >
      <Form form={form} layout="vertical" onFinish={handleCreateJob} onValuesChange={saveDraft}>
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
              <Form.Item
                label="Ngày bắt đầu nhận CV"
                name="startDate"
                rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu nhận CV" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày bắt đầu"
                  disabledDate={(current) =>
                    !isEditing && current.startOf("day").isBefore(dayjs().startOf("day"))
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hạn chót nộp CV"
                name="deadline"
                dependencies={["startDate"]}
                rules={[
                  { required: true, message: "Vui lòng chọn hạn chót nộp CV" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue("startDate");
                      if (!value || !startDate || !dayjs(value).isBefore(dayjs(startDate), "day")) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Hạn chót phải bằng hoặc sau ngày bắt đầu nhận CV"));
                    },
                  }),
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn hạn chót"
                  disabledDate={(current) => {
                    if (isEditing) return false;
                    const startDate = form.getFieldValue("startDate") || dayjs();
                    return current.startOf("day").isBefore(dayjs(startDate).startOf("day"));
                  }}
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

          <Divider orientation={"left" as any}>Tiêu chí đánh giá hồ sơ</Divider>
          <Form.List
            name="criteria"
            initialValue={[
              { name: "Kinh nghiệm chuyên môn", weight: 40, priorityLevel: "REQUIRED", criterionGroupId: "criterion-total-experience", criterionType: "TOTAL_EXPERIENCE", operator: "EXISTS", evidenceSources: ["EXPERIENCE"] },
              { name: "Kỹ năng chuyên môn", weight: 40, priorityLevel: "REQUIRED", criterionGroupId: "criterion-skill", criterionType: "SKILL", operator: "EXISTS", evidenceSources: ["SKILLS", "EXPERIENCE", "PROJECTS"] },
              { name: "Kỹ năng mềm", weight: 20, priorityLevel: "PREFERRED", criterionGroupId: "criterion-skill", criterionType: "SKILL", operator: "EXISTS", evidenceSources: ["EXPERIENCE", "PROJECTS"] },
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
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 12, borderColor: "#dbe4f0" }}
                    title={`Tiêu chí ${index + 1}`}
                    extra={fields.length > 1 ? (
                      <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />}>
                        Xóa
                      </Button>
                    ) : null}
                  >
                    <Row gutter={12}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          {...restField}
                          label="Tên tiêu chí"
                          name={[name, "name"]}
                          rules={[{ required: true, whitespace: true, message: "Nhập tên tiêu chí" }]}
                        >
                          <Input placeholder="Ví dụ: ASP.NET Core" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={7}>
                        <Form.Item {...restField} label="Mức độ" name={[name, "priorityLevel"]}>
                          <Select options={[
                            { value: "REQUIRED", label: "Bắt buộc" },
                            { value: "PREFERRED", label: "Ưu tiên" },
                            { value: "BONUS", label: "Khuyến khích" },
                          ]} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={5}>
                        <Form.Item
                          {...restField}
                          label="Trọng số"
                          name={[name, "weight"]}
                          rules={[{ required: true, message: "Nhập trọng số" }]}
                        >
                          <InputNumber min={1} max={100} style={{ width: "100%" }} addonAfter="%" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Collapse
                      ghost
                      items={[{
                        key: "advanced",
                        label: "Cấu hình cách chấm tiêu chí",
                        children: (
                          <>
                            <Row gutter={12}>
                              <Col xs={24} md={8}>
                                <Form.Item
                                  {...restField}
                                  label="Nhóm đánh giá"
                                  name={[name, "criterionGroupId"]}
                                  tooltip="Giúp hệ thống xác định khu vực phù hợp trong CV. Tiêu chí cụ thể được nhập ở ô Tên tiêu chí."
                                >
                                  <Select
                                    showSearch
                                    optionFilterProp="label"
                                    options={(criterionGroups.length ? criterionGroups : DEFAULT_CRITERION_GROUPS)
                                      .map((group) => ({
                                        value: group.id,
                                        label: group.name,
                                        title: group.description || undefined,
                                      }))}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={8}>
                                <Form.Item {...restField} label="Yêu cầu đạt" name={[name, "operator"]}>
                                  <Select options={[
                                    { value: "EXISTS", label: "Có bằng chứng" },
                                    { value: "MINIMUM", label: "Tối thiểu" },
                                    { value: "MAXIMUM", label: "Tối đa" },
                                    { value: "EQUALS", label: "Bằng" },
                                    { value: "IN", label: "Thuộc danh sách" },
                                  ]} />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={8}>
                                <Form.Item
                                  {...restField}
                                  label="Kinh nghiệm tối thiểu"
                                  name={[name, "minDurationMonths"]}
                                  tooltip="Chỉ nhập khi tiêu chí yêu cầu thời lượng cụ thể."
                                >
                                  <InputNumber min={1} max={1200} style={{ width: "100%" }} addonAfter="tháng" />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Form.Item
                              {...restField}
                              label="Mô tả tiêu chí (không bắt buộc)"
                              name={[name, "evaluationGuidance"]}
                              tooltip="Chỉ cần nhập khi tên tiêu chí chưa mô tả rõ thế nào được xem là đáp ứng."
                            >
                              <Input.TextArea
                                rows={2}
                                placeholder="Ví dụ: Ứng viên mô tả tình huống phối hợp nhóm hoặc vai trò cụ thể trong dự án."
                              />
                            </Form.Item>
                          </>
                        ),
                      }]}
                    />
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ priorityLevel: "PREFERRED", criterionGroupId: "criterion-custom", criterionType: "CUSTOM", operator: "EXISTS", evidenceSources: ["SKILLS", "EXPERIENCE", "PROJECTS"] })}
                    block
                    icon={<PlusOutlined />}
                  >
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
              {isReposting
                ? "Tạo đợt mới và gửi duyệt"
                : isEditing ? "Lưu và gửi duyệt lại" : "Gửi duyệt tin"}
            </Button>
            <Button
              onClick={() => navigate(
                isReposting && repostSourceId
                  ? `/recruiter/jobs/${repostSourceId}`
                  : "/recruiter/jobs"
              )}
            >
              Hủy
            </Button>
          </Space>
        </Card>
      </Form>
    </PageContainer>
  );
}

export default CreateJobPage;
