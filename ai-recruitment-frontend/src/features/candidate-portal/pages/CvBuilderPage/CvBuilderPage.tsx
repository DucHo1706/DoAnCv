import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileAddOutlined,
  PlusOutlined,
  SaveOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  ColorPicker,
  Form,
  Input,
  Popconfirm,
  Progress,
  Radio,
  Row,
  Segmented,
  Select,
  Slider,
  Space,
  Typography,
  message,
} from "antd";
import { appTheme } from "../../../../constants/theme";
import { cvBuilderService, type CvBuilderDocumentSummary } from "../../services/cvBuilderService";

const { Text, Title } = Typography;
const { TextArea } = Input;
const STORAGE_KEY = "recruitinsight_cv_builder_draft_v2";

type TemplateName = "standard" | "modern" | "elegant";
type SectionKey = "summary" | "experience" | "education" | "projects" | "skills" | "certificates";
type EditorStep = "personal" | "experience" | "education" | "projects" | "certificates";

interface EducationItem { school?: string; major?: string; period?: string }
interface ExperienceItem { company?: string; position?: string; period?: string; description?: string }
interface ProjectItem { name?: string; role?: string; description?: string; link?: string }
interface CertificateItem { name?: string; issuer?: string; year?: string }

export interface CvBuilderValues {
  fullName?: string;
  professionalTitle?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  summary?: string;
  skills?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
  certificates?: CertificateItem[];
}

export interface BuilderSettings {
  template: TemplateName;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  density: number;
  fontSize: number;
  headingSize: number;
  frameStyle: "none" | "thin" | "accent";
  zoom: number;
  sectionOrder: SectionKey[];
}

const emptyValues: CvBuilderValues = {
  fullName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  summary: "",
  skills: "",
  education: [{ school: "", major: "", period: "" }],
  experience: [{ company: "", position: "", period: "", description: "" }],
  projects: [{ name: "", role: "", description: "", link: "" }],
  certificates: [],
};

const sampleValues: CvBuilderValues = {
  fullName: "Nguyễn Minh Anh",
  professionalTitle: "Lập trình viên Backend .NET",
  email: "minhanh.nguyen@example.com",
  phone: "090 123 4567",
  address: "Thành phố Hồ Chí Minh",
  website: "linkedin.com/in/nguyen-minh-anh",
  summary: "Lập trình viên Backend định hướng phát triển hệ thống web ổn định và dễ mở rộng. Có kinh nghiệm thực hành với ASP.NET Core, SQL Server và REST API; mong muốn vận dụng kiến thức để tạo ra sản phẩm có giá trị cho người dùng.",
  skills: "C#, ASP.NET Core, SQL Server, ReactJS, Docker, Git",
  experience: [{
    company: "Công ty TNHH Giải pháp Sao Việt",
    position: "Thực tập sinh Backend",
    period: "01/2026 – 06/2026",
    description: "• Phát triển và kiểm thử REST API cho hệ thống quản lý nội bộ.\n• Tối ưu truy vấn SQL, giúp thời gian tải danh sách giảm khoảng 25%.\n• Phối hợp với frontend xử lý lỗi và hoàn thiện tính năng theo sprint.",
  }],
  education: [{ school: "Trường Đại học Ngoại ngữ - Tin học TP.HCM", major: "Công nghệ thông tin", period: "2022 – 2026" }],
  projects: [{
    name: "RecruitInsightAI",
    role: "Backend Developer",
    description: "Xây dựng API tuyển dụng, phân quyền người dùng và tích hợp dịch vụ phân tích CV bằng AI.",
    link: "github.com/nguyen-minh-anh/recruitinsight-ai",
  }],
  certificates: [{ name: "TOEIC 750", issuer: "IIG Việt Nam", year: "2025" }],
};

const editorSteps: Array<{ value: EditorStep; label: string }> = [
  { value: "personal", label: "1. Cá nhân" },
  { value: "experience", label: "2. Kinh nghiệm" },
  { value: "education", label: "3. Học vấn" },
  { value: "projects", label: "4. Dự án" },
  { value: "certificates", label: "5. Chứng chỉ" },
];

export const defaultSettings: BuilderSettings = {
  template: "standard",
  accentColor: "#2563EB",
  textColor: "#0F172A",
  fontFamily: "Arial, sans-serif",
  density: 16,
  fontSize: 13,
  headingSize: 13,
  frameStyle: "thin",
  zoom: 100,
  sectionOrder: ["summary", "experience", "education", "projects", "skills", "certificates"],
};

export function normalizeCvValues(source?: CvBuilderValues): CvBuilderValues {
  const stored = source || {};
  return {
    ...emptyValues,
    ...stored,
    education: Array.isArray(stored.education) && stored.education.length ? stored.education : emptyValues.education,
    experience: Array.isArray(stored.experience) && stored.experience.length ? stored.experience : emptyValues.experience,
    projects: Array.isArray(stored.projects) && stored.projects.length ? stored.projects : emptyValues.projects,
    certificates: Array.isArray(stored.certificates) ? stored.certificates : [],
  };
}

function loadDraft(): { values: CvBuilderValues; settings: BuilderSettings } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { values: emptyValues, settings: defaultSettings };
    const parsed = JSON.parse(raw) as { values?: CvBuilderValues; settings?: BuilderSettings };
    const stored = parsed.values || {};
    return {
      values: normalizeCvValues(stored),
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
    };
  } catch {
    return { values: emptyValues, settings: defaultSettings };
  }
}

export default function CvBuilderPage() {
  const initialDraft = useMemo(() => loadDraft(), []);
  const [form] = Form.useForm<CvBuilderValues>();
  const [values, setValues] = useState(initialDraft.values);
  const [settings, setSettings] = useState(initialDraft.settings);
  const [documentName, setDocumentName] = useState("CV chưa đặt tên");
  const [documentId, setDocumentId] = useState<string>();
  const [documents, setDocuments] = useState<CvBuilderDocumentSummary[]>([]);
  const [savingToAccount, setSavingToAccount] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [editorStep, setEditorStep] = useState<EditorStep>("personal");
  const [starterDismissed, setStarterDismissed] = useState(false);

  useEffect(() => {
    form.setFieldsValue(initialDraft.values);
  }, [form, initialDraft]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, settings }));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [values, settings]);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    cvBuilderService.getAll().then(setDocuments).catch(() => undefined);
  }, []);

  const skills = useMemo(
    () => (values.skills || "").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean),
    [values.skills]
  );
  const completion = useMemo(() => {
    const checks = [
      Boolean(values.fullName),
      Boolean(values.email || values.phone),
      Boolean(values.professionalTitle),
      Boolean(values.summary && values.summary.trim().length >= 40),
      skills.length >= 3,
      Boolean(values.experience?.some((item) => item.position && item.description)),
      Boolean(values.education?.some((item) => item.school && item.major)),
      Boolean(values.projects?.some((item) => item.name && item.description)),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [skills.length, values]);
  const isBlankCv = useMemo(
    () => !values.fullName && !values.professionalTitle && !values.summary
      && !values.experience?.some((item) => item.company || item.position || item.description)
      && !values.education?.some((item) => item.school || item.major)
      && !values.projects?.some((item) => item.name || item.description),
    [values]
  );

  const applySampleValues = () => {
    form.setFieldsValue(sampleValues);
    setValues(sampleValues);
    setDocumentName("CV Lập trình viên Backend .NET");
    setStarterDismissed(true);
    setEditorStep("personal");
    message.success("Đã điền nội dung mẫu. Hãy thay bằng thông tin thật của bạn.");
  };

  const moveEditorStep = (direction: -1 | 1) => {
    const currentIndex = editorSteps.findIndex((item) => item.value === editorStep);
    const next = editorSteps[currentIndex + direction];
    if (next) setEditorStep(next.value);
  };

  const saveDraft = () => {
    const currentValues = form.getFieldsValue(true);
    setValues(currentValues);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: currentValues, settings }));
    message.success("Đã lưu bản nháp CV trên trình duyệt này.");
  };

  const saveToAccount = async () => {
    if (!localStorage.getItem("token")) {
      saveDraft();
      message.info("Đăng nhập tài khoản ứng viên để lưu CV trên hệ thống.");
      return;
    }
    try {
      await form.validateFields();
      const currentValues = form.getFieldsValue(true);
      if (!documentName.trim()) {
        message.warning("Vui lòng đặt tên CV.");
        return;
      }
      setSavingToAccount(true);
      const saved = documentId
        ? await cvBuilderService.update(documentId, documentName.trim(), currentValues, settings)
        : await cvBuilderService.create(documentName.trim(), currentValues, settings);
      setDocumentId(saved.id);
      setValues(currentValues);
      setDocuments(await cvBuilderService.getAll());
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: currentValues, settings }));
      message.success("Đã lưu CV vào tài khoản.");
    } catch (error: any) {
      const currentValues = form.getFieldsValue(true);
      setValues(currentValues);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: currentValues, settings }));
      const status = error?.response?.status;
      if (status === 404) {
        message.error("Máy chủ chưa được cập nhật chức năng lưu CV. Bản nháp vẫn được giữ trên thiết bị này.");
      } else if (status >= 500) {
        message.error("Máy chủ chưa thể lưu CV. Bản nháp vẫn được giữ trên thiết bị này, vui lòng thử lại sau.");
      } else {
        message.error(error?.response?.data?.message || "Không thể lưu CV vào tài khoản. Bản nháp vẫn được giữ trên thiết bị này.");
      }
    } finally {
      setSavingToAccount(false);
    }
  };

  const loadDocument = async (id: string) => {
    try {
      const document = await cvBuilderService.getById<CvBuilderValues, BuilderSettings>(id);
      const loadedValues = normalizeCvValues(document.content);
      const loadedSettings = { ...defaultSettings, ...document.settings };
      setDocumentId(document.id);
      setDocumentName(document.name);
      setValues(loadedValues);
      setSettings(loadedSettings);
      form.setFieldsValue(loadedValues);
      setStarterDismissed(true);
      setEditorStep("personal");
      message.success(`Đã mở ${document.name}.`);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể mở CV đã lưu.");
    }
  };

  const createNewDocument = () => {
    setDocumentId(undefined);
    setDocumentName("CV chưa đặt tên");
    setValues(emptyValues);
    setSettings(defaultSettings);
    form.resetFields();
    form.setFieldsValue(emptyValues);
    setStarterDismissed(false);
    setEditorStep("personal");
  };

  const setDefaultDocument = async () => {
    if (!documentId) return;
    try {
      await cvBuilderService.setDefault(documentId);
      setDocuments(await cvBuilderService.getAll());
      message.success("Đã đặt làm CV mặc định.");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể đặt CV mặc định.");
    }
  };

  const deleteDocument = async () => {
    if (!documentId) return;
    try {
      await cvBuilderService.remove(documentId);
      createNewDocument();
      setDocuments(await cvBuilderService.getAll());
      message.success("Đã xóa CV.");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể xóa CV.");
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= settings.sectionOrder.length) return;
    const sectionOrder = [...settings.sectionOrder];
    [sectionOrder[index], sectionOrder[target]] = [sectionOrder[target], sectionOrder[index]];
    setSettings((old) => ({ ...old, sectionOrder }));
  };

  const printPdf = async () => {
    try {
      await form.validateFields();
      const currentValues = form.getFieldsValue(true);
      if (!currentValues.email && !currentValues.phone) {
        message.warning("Vui lòng nhập email hoặc số điện thoại trước khi lưu PDF.");
        return;
      }
      setValues(currentValues);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: currentValues, settings }));
      setExportingPdf(true);
      await new Promise((resolve) => window.setTimeout(resolve, 100));

      const preview = document.getElementById("cv-builder-preview");
      if (!preview) throw new Error("Không tìm thấy bản xem trước CV.");

      const clone = preview.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      Object.assign(clone.style, {
        width: "210mm",
        minHeight: "297mm",
        transform: "none",
        transformOrigin: "top left",
        border: "none",
        borderRadius: "0",
        boxShadow: "none",
        outline: "none",
        overflow: "visible",
      });

      const renderHost = document.createElement("div");
      Object.assign(renderHost.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: "210mm",
        background: "#FFFFFF",
        zIndex: "-1",
      });
      renderHost.appendChild(clone);
      document.body.appendChild(renderHost);

      try {
        const html2pdfModule = await import("html2pdf.js");
        const html2pdf = html2pdfModule.default || html2pdfModule;
        const safeName = (documentName.trim() || "CV")
          .replace(/[\\/:*?"<>|]+/g, "-")
          .replace(/\s+/g, " ");
        await (html2pdf as any)()
          .set({
            margin: 0,
            filename: `${safeName}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FFFFFF", logging: false },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["css", "legacy"] },
          })
          .from(clone)
          .save();
        message.success("Đã tải CV dưới dạng PDF.");
      } finally {
        renderHost.remove();
      }
    } catch (error: any) {
      message.error(error?.message || "Không thể tạo tệp PDF. Vui lòng thử lại.");
    } finally {
      setExportingPdf(false);
    }
  };

  const previewStyle: CSSProperties = {
    width: "100%",
    minHeight: 980,
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
    color: settings.textColor,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    padding: settings.template === "modern" ? 0 : "44px 48px",
    overflow: "hidden",
    outline: settings.frameStyle === "none" ? "none" : settings.frameStyle === "accent" ? `3px solid ${settings.accentColor}` : "1px solid #CBD5E1",
    transform: `scale(${settings.zoom / 100})`,
    transformOrigin: "top center",
  };

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: "24px 20px 56px" }}>
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: appTheme.colors.textPrimary }}>Tạo CV trực tuyến</Title>
        </Col>
        <Col>
          <Space wrap>
            {localStorage.getItem("token") ? (
              <Select
                allowClear
                placeholder="Mở CV đã lưu"
                value={documentId}
                style={{ minWidth: 190 }}
                onChange={(id) => id && loadDocument(id)}
                options={documents.map((document) => ({ value: document.id, label: `${document.name}${document.isDefault ? " · Mặc định" : ""}` }))}
              />
            ) : null}
            <Button icon={<FileAddOutlined />} onClick={createNewDocument}>CV mới</Button>
            <Button icon={<SaveOutlined />} loading={savingToAccount} onClick={saveToAccount}>Lưu CV</Button>
            {documentId ? <Button icon={<StarOutlined />} onClick={setDefaultDocument}>Đặt mặc định</Button> : null}
            {documentId ? (
              <Popconfirm title="Xóa CV này?" description="Thao tác này không ảnh hưởng các CV đã dùng để ứng tuyển." okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }} onConfirm={deleteDocument}>
                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
            ) : null}
            <Button type="primary" icon={<DownloadOutlined />} loading={exportingPdf} onClick={printPdf}>Lưu dưới dạng PDF</Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: 20, border: "1px solid #E2E8F0", borderRadius: 16 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} lg={6}>
            <Text strong>Tên CV</Text>
            <Input value={documentName} maxLength={150} onChange={(event) => setDocumentName(event.target.value)} style={{ marginTop: 8 }} />
          </Col>
          <Col xs={24} lg={8}>
            <Text strong>Mẫu CV</Text>
            <Radio.Group
              value={settings.template}
              onChange={(event) => setSettings((old) => ({ ...old, template: event.target.value }))}
              style={{ display: "flex", marginTop: 8 }}
            >
              <Radio.Button value="standard">Tiêu chuẩn</Radio.Button>
              <Radio.Button value="modern">Hiện đại</Radio.Button>
              <Radio.Button value="elegant">Thanh lịch</Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={12} md={8} lg={5}>
            <Text strong>Màu chủ đạo</Text>
            <div style={{ marginTop: 8 }}>
              <ColorPicker
                value={settings.accentColor}
                presets={[{ label: "Gợi ý", colors: ["#2563EB", "#0F766E", "#7C3AED", "#C2410C", "#334155"] }]}
                onChange={(_, hex) => setSettings((old) => ({ ...old, accentColor: hex }))}
              />
            </div>
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Text strong>Màu chữ</Text>
            <div style={{ marginTop: 8 }}>
              <ColorPicker
                value={settings.textColor}
                presets={[{ label: "Dễ đọc", colors: ["#0F172A", "#1E293B", "#334155", "#1F2937", "#111827"] }]}
                onChange={(_, hex) => setSettings((old) => ({ ...old, textColor: hex }))}
              />
            </div>
          </Col>
          <Col xs={12} md={8} lg={5}>
            <Text strong>Phông chữ</Text>
            <Select
              value={settings.fontFamily}
              style={{ width: "100%", marginTop: 8 }}
              onChange={(fontFamily) => setSettings((old) => ({ ...old, fontFamily }))}
              options={[
                { value: "Arial, sans-serif", label: "Arial" },
                { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
                { value: "Georgia, serif", label: "Georgia" },
                { value: "'Times New Roman', serif", label: "Times New Roman" },
              ]}
            />
          </Col>
          <Col xs={24} md={8} lg={4}>
            <Text strong>Khoảng cách</Text>
            <Slider min={12} max={22} value={settings.density} onChange={(density) => setSettings((old) => ({ ...old, density }))} />
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Text strong>Cỡ chữ nội dung</Text>
            <Slider min={10} max={15} value={settings.fontSize} onChange={(fontSize) => setSettings((old) => ({ ...old, fontSize }))} />
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Text strong>Cỡ tiêu đề mục</Text>
            <Slider min={12} max={18} value={settings.headingSize} onChange={(headingSize) => setSettings((old) => ({ ...old, headingSize }))} />
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Text strong>Khung CV</Text>
            <Select
              value={settings.frameStyle}
              style={{ width: "100%", marginTop: 8 }}
              onChange={(frameStyle) => setSettings((old) => ({ ...old, frameStyle }))}
              options={[{ value: "none", label: "Không khung" }, { value: "thin", label: "Viền mảnh" }, { value: "accent", label: "Viền màu" }]}
            />
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Text strong>Thu phóng bản xem trước</Text>
            <Slider min={70} max={110} step={5} value={settings.zoom} tooltip={{ formatter: (value) => `${value}%` }} onChange={(zoom) => setSettings((old) => ({ ...old, zoom }))} />
          </Col>
          <Col xs={24} lg={8}>
            <Text strong>Thứ tự các mục</Text>
            <Space wrap size={4} style={{ marginTop: 8 }}>
              {settings.sectionOrder.map((section, index) => (
                <span key={section} style={{ display: "inline-flex", alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 6, paddingLeft: 8, background: "#FFFFFF" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, marginRight: 6, borderRadius: 5, background: "#EFF6FF", color: "#1D4ED8", fontSize: 11, fontWeight: 700 }}>
                    {index + 1}
                  </span>
                  <Text style={{ fontSize: 12 }}>{sectionLabels[section]}</Text>
                  <Button size="small" type="text" aria-label="Chuyển mục lên" disabled={index === 0} icon={<ArrowUpOutlined />} onClick={() => moveSection(index, -1)} />
                  <Button size="small" type="text" aria-label="Chuyển mục xuống" disabled={index === settings.sectionOrder.length - 1} icon={<ArrowDownOutlined />} onClick={() => moveSection(index, 1)} />
                </span>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} xl={11} className="cv-builder-editor">
          <Card title="Nội dung CV" style={{ border: "1px solid #E2E8F0", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
              <Progress percent={completion} size="small" strokeColor="#2563EB" style={{ flex: 1, margin: 0 }} />
              <Text type="secondary" style={{ whiteSpace: "nowrap", fontSize: 12 }}>Mức độ hoàn thiện</Text>
            </div>
            {isBlankCv && !starterDismissed && (
              <div style={{ marginBottom: 20, padding: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12 }}>
                <Text strong style={{ display: "block", color: "#0F172A" }}>Chưa biết bắt đầu từ đâu?</Text>
                <Text type="secondary" style={{ display: "block", margin: "4px 0 12px" }}>
                  Dùng một CV mẫu hoàn chỉnh để xem cách viết, sau đó thay bằng thông tin thật của bạn.
                </Text>
                <Space wrap>
                  <Button type="primary" onClick={applySampleValues}>Dùng nội dung mẫu</Button>
                  <Button onClick={() => setStarterDismissed(true)}>Tự nhập từ đầu</Button>
                </Space>
              </div>
            )}
            <Segmented
              block
              value={editorStep}
              options={editorSteps}
              onChange={(value) => setEditorStep(value as EditorStep)}
              style={{ marginBottom: 20 }}
            />
            <Form<CvBuilderValues>
              form={form}
              layout="vertical"
              initialValues={initialDraft.values}
              preserve
              onValuesChange={(changedValues) => setValues((current) => ({ ...current, ...changedValues }))}
            >
              <div style={{ display: editorStep === "personal" ? "block" : "none" }}>
              <Title level={5}>Thông tin cá nhân</Title>
              <Row gutter={12}>
                <Col xs={24} md={12}><Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}><Input placeholder="Nguyễn Văn A" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="professionalTitle" label="Vị trí chuyên môn"><Input placeholder="Lập trình viên Backend" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="email" label="Email" rules={[{ type: "email", message: "Email chưa hợp lệ" }]}><Input placeholder="email@example.com" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="phone" label="Số điện thoại"><Input placeholder="09xxxxxxxx" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="address" label="Địa chỉ"><Input placeholder="Thành phố Hồ Chí Minh" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="website" label="Website / LinkedIn"><Input placeholder="linkedin.com/in/ten-cua-ban" /></Form.Item></Col>
              </Row>
              <Form.Item name="summary" label="Mục tiêu nghề nghiệp"><TextArea rows={4} placeholder="Tóm tắt kinh nghiệm, định hướng và giá trị bạn có thể đóng góp." /></Form.Item>
              <Form.Item name="skills" label="Kỹ năng" extra="Phân tách bằng dấu phẩy hoặc xuống dòng."><TextArea rows={3} placeholder="C#, ASP.NET Core, SQL Server, Docker" /></Form.Item>
              </div>

              <div style={{ display: editorStep === "experience" ? "block" : "none" }}>
              <RepeatableSection title="Kinh nghiệm làm việc" name="experience" addLabel="Thêm kinh nghiệm" emptyValue={{}} render={(name, rest) => (
                <Row gutter={12}>
                  <Col xs={24} md={12}><Form.Item {...rest} name={[name, "company"]} label="Công ty"><Input /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item {...rest} name={[name, "position"]} label="Vị trí"><Input /></Form.Item></Col>
                  <Col span={24}><Form.Item {...rest} name={[name, "period"]} label="Thời gian"><Input placeholder="01/2024 – 07/2026" /></Form.Item></Col>
                  <Col span={24}><Form.Item {...rest} name={[name, "description"]} label="Mô tả và kết quả"><TextArea rows={3} placeholder="Ưu tiên hành động, kết quả và số liệu có thể kiểm chứng." /></Form.Item></Col>
                </Row>
              )} />
              </div>

              <div style={{ display: editorStep === "education" ? "block" : "none" }}>
              <RepeatableSection title="Học vấn" name="education" addLabel="Thêm học vấn" emptyValue={{}} render={(name, rest) => (
                <>
                  <Form.Item {...rest} name={[name, "school"]} label="Trường / Cơ sở đào tạo"><Input /></Form.Item>
                  <Row gutter={12}>
                    <Col xs={24} md={12}><Form.Item {...rest} name={[name, "major"]} label="Chuyên ngành"><Input /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item {...rest} name={[name, "period"]} label="Thời gian"><Input placeholder="2022 – 2026" /></Form.Item></Col>
                  </Row>
                </>
              )} />
              </div>

              <div style={{ display: editorStep === "projects" ? "block" : "none" }}>
              <RepeatableSection title="Dự án" name="projects" addLabel="Thêm dự án" emptyValue={{}} render={(name, rest) => (
                <Row gutter={12}>
                  <Col xs={24} md={12}><Form.Item {...rest} name={[name, "name"]} label="Tên dự án"><Input /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item {...rest} name={[name, "role"]} label="Vai trò"><Input /></Form.Item></Col>
                  <Col span={24}><Form.Item {...rest} name={[name, "description"]} label="Mô tả"><TextArea rows={3} /></Form.Item></Col>
                  <Col span={24}><Form.Item {...rest} name={[name, "link"]} label="Liên kết"><Input /></Form.Item></Col>
                </Row>
              )} />
              </div>

              <div style={{ display: editorStep === "certificates" ? "block" : "none" }}>
              <RepeatableSection title="Chứng chỉ" name="certificates" addLabel="Thêm chứng chỉ" emptyValue={{}} render={(name, rest) => (
                <Row gutter={12}>
                  <Col xs={24} md={12}><Form.Item {...rest} name={[name, "name"]} label="Tên chứng chỉ"><Input /></Form.Item></Col>
                  <Col xs={24} md={8}><Form.Item {...rest} name={[name, "issuer"]} label="Đơn vị cấp"><Input /></Form.Item></Col>
                  <Col xs={24} md={4}><Form.Item {...rest} name={[name, "year"]} label="Năm"><Input /></Form.Item></Col>
                </Row>
              )} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
                <Button disabled={editorStep === editorSteps[0].value} onClick={() => moveEditorStep(-1)}>Quay lại</Button>
                <Text type="secondary">Bước {editorSteps.findIndex((item) => item.value === editorStep) + 1}/{editorSteps.length}</Text>
                <Button type="primary" disabled={editorStep === editorSteps[editorSteps.length - 1].value} onClick={() => moveEditorStep(1)}>Tiếp theo</Button>
              </div>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={13}>
          <div style={{ position: "sticky", top: 84 }}>
            <Text strong style={{ display: "block", marginBottom: 10 }}>Xem trước khổ A4</Text>
            <div id="cv-builder-preview" style={previewStyle}>
              <CvPreview values={values} skills={skills} settings={settings} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

function RepeatableSection({ title, name, addLabel, emptyValue, render }: {
  title: string;
  name: keyof Pick<CvBuilderValues, "experience" | "education" | "projects" | "certificates">;
  addLabel: string;
  emptyValue: object;
  render: (name: number, rest: { fieldKey?: number }) => ReactNode;
}) {
  return (
    <div style={{ marginTop: 24 }}>
      <Title level={5}>{title}</Title>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {fields.map(({ key, name: fieldName, ...rest }, index) => (
              <Card key={key} size="small" title={`${title} ${index + 1}`} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }} extra={<Button aria-label={`Xóa ${title.toLowerCase()}`} type="text" danger icon={<DeleteOutlined />} onClick={() => remove(fieldName)} />}>
                {render(fieldName, rest)}
              </Card>
            ))}
            <Button block icon={<PlusOutlined />} onClick={() => add(emptyValue)}>{addLabel}</Button>
          </Space>
        )}
      </Form.List>
    </div>
  );
}

export function CvPreview({ values, skills, settings }: { values: CvBuilderValues; skills: string[]; settings: BuilderSettings }) {
  const content = <PreviewContent values={values} skills={skills} settings={settings} />;
  if (settings.template === "modern") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "34% 66%", minHeight: 980 }}>
        <aside style={{ background: settings.accentColor, color: "white", padding: "44px 28px" }}>
          <h1 style={{ fontSize: 29, lineHeight: 1.12, margin: 0 }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
          <div style={{ marginTop: 10, fontWeight: 700 }}>{values.professionalTitle || "Vị trí chuyên môn"}</div>
          <div style={{ marginTop: 30, fontSize: 12, lineHeight: 1.9 }}>{[values.email, values.phone, values.address, values.website].filter(Boolean).map((item) => <div key={item}>{item}</div>)}</div>
          {skills.length > 0 && <SideSection title="KỸ NĂNG">{skills.map((skill) => <div key={skill} style={{ marginBottom: 8 }}>{skill}</div>)}</SideSection>}
          {(values.certificates || []).some((item) => item.name) && <SideSection title="CHỨNG CHỈ">{values.certificates?.filter((item) => item.name).map((item, index) => <div key={index} style={{ marginBottom: 10 }}><strong>{item.name}</strong><div style={{ opacity: 0.85 }}>{[item.issuer, item.year].filter(Boolean).join(" · ")}</div></div>)}</SideSection>}
        </aside>
        <main style={{ padding: "44px 38px", color: settings.textColor }}>{content}</main>
      </div>
    );
  }
  return (
    <>
      <header style={{ borderBottom: settings.template === "elegant" ? `1px solid ${settings.accentColor}` : `3px solid ${settings.accentColor}`, textAlign: settings.template === "elegant" ? "center" : "left", paddingBottom: 20, marginBottom: settings.density + 10 }}>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-0.03em" }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
        <div style={{ color: settings.accentColor, fontSize: 17, fontWeight: 700, marginTop: 6 }}>{values.professionalTitle || "Vị trí chuyên môn"}</div>
        <div style={{ marginTop: 12, color: settings.textColor, opacity: 0.72, fontSize: 12 }}>{[values.email, values.phone, values.address, values.website].filter(Boolean).join("  •  ") || "Email  •  Số điện thoại  •  Địa chỉ"}</div>
      </header>
      {content}
    </>
  );
}

export function PreviewContent({ values, skills, settings }: { values: CvBuilderValues; skills: string[]; settings: BuilderSettings }) {
  const paragraphStyle: CSSProperties = { whiteSpace: "pre-line", lineHeight: 1.55, color: settings.textColor, margin: "6px 0 0", fontSize: settings.fontSize };
  const sections: Record<SectionKey, ReactNode> = {
    summary: values.summary ? <CvSection title="MỤC TIÊU NGHỀ NGHIỆP" settings={settings}><p style={paragraphStyle}>{values.summary}</p></CvSection> : null,
    experience: (values.experience || []).some((item) => item.company || item.position || item.description) ? <CvSection title="KINH NGHIỆM LÀM VIỆC" settings={settings}>{values.experience?.filter((item) => item.company || item.position || item.description).map((item, index) => <PreviewEntry key={index} title={item.position || "Vị trí công việc"} subtitle={item.company} period={item.period} description={item.description} settings={settings} />)}</CvSection> : null,
    education: (values.education || []).some((item) => item.school || item.major) ? <CvSection title="HỌC VẤN" settings={settings}>{values.education?.filter((item) => item.school || item.major).map((item, index) => <PreviewEntry key={index} title={item.school || "Trường / Cơ sở đào tạo"} subtitle={item.major} period={item.period} settings={settings} />)}</CvSection> : null,
    projects: (values.projects || []).some((item) => item.name || item.description) ? <CvSection title="DỰ ÁN" settings={settings}>{values.projects?.filter((item) => item.name || item.description).map((item, index) => <PreviewEntry key={index} title={item.name || "Tên dự án"} subtitle={[item.role, item.link].filter(Boolean).join(" · ")} description={item.description} settings={settings} />)}</CvSection> : null,
    skills: settings.template !== "modern" && skills.length > 0 ? <CvSection title="KỸ NĂNG" settings={settings}><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{skills.map((skill) => <span key={skill} style={{ padding: "4px 9px", borderRadius: 5, background: `${settings.accentColor}12`, color: settings.accentColor, fontSize: settings.fontSize - 1, fontWeight: 700 }}>{skill}</span>)}</div></CvSection> : null,
    certificates: settings.template !== "modern" && (values.certificates || []).some((item) => item.name) ? <CvSection title="CHỨNG CHỈ" settings={settings}>{values.certificates?.filter((item) => item.name).map((item, index) => <PreviewEntry key={index} title={item.name || ""} subtitle={item.issuer} period={item.year} settings={settings} />)}</CvSection> : null,
  };
  return <>{settings.sectionOrder.map((section) => <div key={section}>{sections[section]}</div>)}</>;
}

function PreviewEntry({ title, subtitle, period, description, settings }: { title: string; subtitle?: string; period?: string; description?: string; settings: BuilderSettings }) {
  return <div style={{ marginBottom: 15, color: settings.textColor }}><div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><strong style={{ fontSize: settings.fontSize + 0.5 }}>{title}</strong><span style={{ color: settings.textColor, opacity: 0.7, fontSize: settings.fontSize - 1, whiteSpace: "nowrap" }}>{period}</span></div>{subtitle && <div style={{ color: settings.accentColor, fontWeight: 600, fontSize: settings.fontSize - 0.5, marginTop: 2 }}>{subtitle}</div>}{description && <p style={{ whiteSpace: "pre-line", lineHeight: 1.55, color: settings.textColor, fontSize: settings.fontSize, margin: "5px 0 0" }}>{description}</p>}</div>;
}

function CvSection({ title, settings, children }: { title: string; settings: BuilderSettings; children: ReactNode }) {
  return <section style={{ marginBottom: settings.density }}><h2 style={{ fontSize: settings.headingSize, letterSpacing: "0.08em", color: settings.accentColor, margin: "0 0 10px", paddingBottom: 6, borderBottom: `1px solid ${settings.accentColor}55` }}>{title}</h2>{children}</section>;
}

function SideSection({ title, children }: { title: string; children: ReactNode }) {
  return <section style={{ marginTop: 30, fontSize: 12 }}><h2 style={{ fontSize: 12, letterSpacing: "0.09em", borderBottom: "1px solid rgba(255,255,255,.45)", paddingBottom: 7 }}>{title}</h2>{children}</section>;
}

const sectionLabels: Record<SectionKey, string> = {
  summary: "Mục tiêu",
  experience: "Kinh nghiệm",
  education: "Học vấn",
  projects: "Dự án",
  skills: "Kỹ năng",
  certificates: "Chứng chỉ",
};
