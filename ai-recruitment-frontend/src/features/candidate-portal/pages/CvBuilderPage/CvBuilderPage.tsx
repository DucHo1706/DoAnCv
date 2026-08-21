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
  AppstoreOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  MailOutlined,
  PhoneOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  ColorPicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  Typography,
  Upload,
  message,
} from "antd";
import { appTheme } from "../../../../constants/theme";
import { cvBuilderService, type CvBuilderDocumentSummary } from "../../services/cvBuilderService";

const { Text, Title } = Typography;
const { TextArea } = Input;
const STORAGE_KEY = "recruitinsight_cv_builder_draft_v2";

export type TemplateName =
  | "standard"
  | "modern"
  | "elegant"
  | "minimal"
  | "compact"
  | "corporate"
  | "technical"
  | "timeline"
  | "executive"
  | "graduate"
  | "academic"
  | "creative"
  | "custom";
type SectionKey = "summary" | "experience" | "education" | "projects" | "skills" | "certificates";
type EditorStep = "personal" | "experience" | "education" | "projects" | "certificates";

interface EducationItem { school?: string; major?: string; period?: string }
interface ExperienceItem { company?: string; position?: string; period?: string; description?: string }
interface ProjectItem { name?: string; role?: string; description?: string; link?: string }
interface CertificateItem { name?: string; issuer?: string; year?: string }

export interface CvBuilderValues {
  avatarDataUrl?: string;
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
  customLayout: "single" | "columns" | "sidebar";
  customSidebarWidth: number;
  customSidebarSections: SectionKey[];
  avatarSize: number;
  avatarShape: "circle" | "rounded" | "square";
  avatarPosition: "left" | "right";
  showContactIcons: boolean;
  hiddenSections: SectionKey[];
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
  customLayout: "single",
  customSidebarWidth: 34,
  customSidebarSections: ["skills", "education", "certificates"],
  avatarSize: 92,
  avatarShape: "circle",
  avatarPosition: "right",
  showContactIcons: true,
  hiddenSections: [],
};

const templateOptions: Array<{
  value: TemplateName;
  name: string;
  description: string;
  group: "Phổ biến" | "Theo nghề nghiệp" | "Đặc biệt";
  layout: "single" | "sidebar" | "columns" | "timeline";
}> = [
  { value: "standard", name: "Tiêu chuẩn", description: "Rõ ràng, phù hợp nhiều vị trí", group: "Phổ biến", layout: "single" },
  { value: "modern", name: "Hiện đại", description: "Thanh bên nổi bật kỹ năng", group: "Phổ biến", layout: "sidebar" },
  { value: "elegant", name: "Thanh lịch", description: "Cân đối, tiêu đề căn giữa", group: "Phổ biến", layout: "single" },
  { value: "minimal", name: "Tối giản", description: "Ít trang trí, dễ đọc nhanh", group: "Phổ biến", layout: "single" },
  { value: "corporate", name: "Doanh nghiệp", description: "Trang trọng cho tài chính, HR", group: "Theo nghề nghiệp", layout: "columns" },
  { value: "technical", name: "Công nghệ", description: "Nhấn mạnh kỹ năng và dự án", group: "Theo nghề nghiệp", layout: "sidebar" },
  { value: "executive", name: "Quản lý", description: "Ưu tiên thành tựu và kinh nghiệm", group: "Theo nghề nghiệp", layout: "single" },
  { value: "academic", name: "Học thuật", description: "Phù hợp nghiên cứu, giáo dục", group: "Theo nghề nghiệp", layout: "single" },
  { value: "graduate", name: "Sinh viên", description: "Ưu tiên học vấn và dự án", group: "Theo nghề nghiệp", layout: "columns" },
  { value: "compact", name: "Gọn một trang", description: "Mật độ cao, tiết kiệm không gian", group: "Đặc biệt", layout: "columns" },
  { value: "timeline", name: "Dòng thời gian", description: "Làm rõ quá trình làm việc", group: "Đặc biệt", layout: "timeline" },
  { value: "creative", name: "Sáng tạo", description: "Bố cục mạnh cho marketing", group: "Đặc biệt", layout: "sidebar" },
  { value: "custom", name: "Tùy chỉnh bố cục", description: "Tự chọn cột và phân bổ nội dung", group: "Đặc biệt", layout: "columns" },
];

const fullBleedTemplates = new Set<TemplateName>(["modern", "technical", "creative"]);

export function getCvPagePadding(template: TemplateName): string | number {
  if (fullBleedTemplates.has(template)) return 0;
  return template === "compact" ? "30px 36px" : "44px 48px";
}

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
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

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

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn tệp ảnh JPG, PNG hoặc WebP.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Ảnh đại diện không được vượt quá 5 MB.");
      return false;
    }
    try {
      const dataUrl = await resizeImage(file, 512, 0.86);
      const nextValues = { ...form.getFieldsValue(true), avatarDataUrl: dataUrl };
      form.setFieldsValue(nextValues);
      setValues(nextValues);
    } catch {
      message.error("Không thể xử lý ảnh này. Vui lòng thử ảnh khác.");
    }
    return false;
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

  const reorderSection = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const sectionOrder = [...settings.sectionOrder];
    const [moved] = sectionOrder.splice(from, 1);
    sectionOrder.splice(to, 0, moved);
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
    padding: getCvPagePadding(settings.template),
    overflow: "hidden",
    outline: settings.frameStyle === "none" ? "none" : settings.frameStyle === "accent" ? `3px solid ${settings.accentColor}` : "1px solid #CBD5E1",
    transform: `scale(${settings.zoom / 100})`,
    transformOrigin: "top center",
  };
  const currentTemplate = templateOptions.find((template) => template.value === settings.template) || templateOptions[0];

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
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, padding: 10, border: "1px solid #E2E8F0", borderRadius: 10, background: "#F8FAFC" }}>
              <div style={{ width: 76, flex: "0 0 76px" }}><TemplateThumbnail layout={currentTemplate.layout} color={settings.accentColor} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text strong style={{ display: "block" }}>{currentTemplate.name}</Text>
                <Text type="secondary" style={{ display: "block", fontSize: 11 }}>{currentTemplate.description}</Text>
              </div>
              <Button icon={<AppstoreOutlined />} onClick={() => setTemplateModalOpen(true)}>Đổi mẫu</Button>
            </div>
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
          <Col xs={24} md={8} lg={5}>
            <Text strong>Bố cục tự thiết kế</Text>
            <Select
              value={settings.customLayout}
              style={{ width: "100%", marginTop: 8 }}
              options={[
                { value: "single", label: "Một cột" },
                { value: "columns", label: "Hai cột nền sáng" },
                { value: "sidebar", label: "Thanh bên có màu" },
              ]}
              onChange={(customLayout) => setSettings((old) => ({ ...old, template: "custom", customLayout }))}
            />
          </Col>
          {settings.template === "custom" && settings.customLayout !== "single" ? (
            <>
              <Col xs={24} md={8} lg={5}>
                <Text strong>Độ rộng cột phụ</Text>
                <Slider min={25} max={45} value={settings.customSidebarWidth} tooltip={{ formatter: (value) => `${value}%` }} onChange={(customSidebarWidth) => setSettings((old) => ({ ...old, customSidebarWidth }))} />
              </Col>
              <Col xs={24} lg={10}>
                <Text strong>Nội dung đặt ở cột phụ</Text>
                <Select
                  mode="multiple"
                  value={settings.customSidebarSections}
                  style={{ width: "100%", marginTop: 8 }}
                  options={Object.entries(sectionLabels).map(([value, label]) => ({ value, label }))}
                  onChange={(customSidebarSections) => setSettings((old) => ({ ...old, customSidebarSections }))}
                />
              </Col>
            </>
          ) : null}
          <Col xs={24} md={12} lg={8}>
            <Text strong>Ảnh đại diện</Text>
            <Space wrap style={{ display: "flex", marginTop: 8 }}>
              <Upload accept="image/png,image/jpeg,image/webp" showUploadList={false} beforeUpload={handleAvatarFile}>
                <Button icon={<PictureOutlined />}>{values.avatarDataUrl ? "Đổi ảnh" : "Chọn ảnh"}</Button>
              </Upload>
              {values.avatarDataUrl ? <Button danger onClick={() => { const next = { ...form.getFieldsValue(true), avatarDataUrl: "" }; form.setFieldsValue(next); setValues(next); }}>Xóa ảnh</Button> : null}
            </Space>
          </Col>
          {values.avatarDataUrl ? (
            <>
              <Col xs={12} md={6} lg={4}>
                <Text strong>Kích thước ảnh</Text>
                <Slider min={56} max={150} value={settings.avatarSize} tooltip={{ formatter: (value) => `${value}px` }} onChange={(avatarSize) => setSettings((old) => ({ ...old, avatarSize }))} />
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Text strong>Kiểu ảnh</Text>
                <Select value={settings.avatarShape} style={{ width: "100%", marginTop: 8 }} options={[{ value: "circle", label: "Hình tròn" }, { value: "rounded", label: "Bo góc" }, { value: "square", label: "Hình vuông" }]} onChange={(avatarShape) => setSettings((old) => ({ ...old, avatarShape }))} />
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Text strong>Vị trí ảnh</Text>
                <Select value={settings.avatarPosition} style={{ width: "100%", marginTop: 8 }} options={[{ value: "left", label: "Bên trái" }, { value: "right", label: "Bên phải" }]} onChange={(avatarPosition) => setSettings((old) => ({ ...old, avatarPosition }))} />
              </Col>
            </>
          ) : null}
          <Col xs={12} md={6} lg={4}>
            <Text strong style={{ display: "block", marginBottom: 10 }}>Icon thông tin liên hệ</Text>
            <Switch checked={settings.showContactIcons} checkedChildren="Hiện" unCheckedChildren="Ẩn" onChange={(showContactIcons) => setSettings((old) => ({ ...old, showContactIcons }))} />
          </Col>
          <Col xs={24} lg={8}>
            <Text strong>Ẩn/hiện mục</Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="Tất cả mục đang hiển thị"
              value={settings.hiddenSections}
              style={{ width: "100%", marginTop: 8 }}
              options={Object.entries(sectionLabels).map(([value, label]) => ({ value, label: `Ẩn ${label.toLowerCase()}` }))}
              onChange={(hiddenSections) => setSettings((old) => ({ ...old, hiddenSections }))}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Text strong>Thứ tự các mục</Text>
            <Space wrap size={4} style={{ marginTop: 8 }}>
              {settings.sectionOrder.map((section, index) => (
                <span
                  key={section}
                  draggable
                  title="Giữ và kéo để đổi vị trí"
                  onDragStart={(event) => event.dataTransfer.setData("text/cv-section-index", String(index))}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); reorderSection(Number(event.dataTransfer.getData("text/cv-section-index")), index); }}
                  style={{ display: "inline-flex", alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 6, paddingLeft: 8, background: "#FFFFFF", cursor: "grab" }}
                >
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

      <Modal
        title="Chọn mẫu CV"
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        footer={null}
        width={900}
      >
        {(["Phổ biến", "Theo nghề nghiệp", "Đặc biệt"] as const).map((group) => (
          <div key={group} style={{ marginTop: 18 }}>
            <Text strong>{group}</Text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginTop: 10 }}>
              {templateOptions.filter((template) => template.group === group).map((template) => (
                <TemplateCard
                  key={template.value}
                  template={template}
                  selected={settings.template === template.value}
                  color={settings.accentColor}
                  onSelect={() => {
                    setSettings((old) => ({ ...old, template: template.value }));
                    setTemplateModalOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </Modal>

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

  if (settings.template === "custom") {
    const asideSections = settings.customSidebarSections || defaultSettings.customSidebarSections;
    const mainSections = settings.sectionOrder.filter((section) => !asideSections.includes(section));
    const sidebarWidth = Math.min(45, Math.max(25, settings.customSidebarWidth || 34));
    const customHeader = (
      <header style={{ display: "flex", flexDirection: settings.avatarPosition === "left" ? "row" : "row-reverse", alignItems: "center", gap: 22, borderBottom: `3px solid ${settings.accentColor}`, paddingBottom: 18, marginBottom: 24 }}>
        {values.avatarDataUrl ? <AvatarImage values={values} settings={settings} /> : null}
        <div style={{ flex: 1 }}><h1 style={{ margin: 0, fontSize: 32 }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
        <div style={{ color: settings.accentColor, fontSize: 17, fontWeight: 700, marginTop: 5 }}>{values.professionalTitle || "Vị trí chuyên môn"}</div>
        <ContactDetails values={values} settings={settings} /></div>
      </header>
    );
    if (settings.customLayout === "single") return <>{customHeader}{content}</>;
    return (
      <>
        {customHeader}
        <div style={{ display: "grid", gridTemplateColumns: `${sidebarWidth}% ${100 - sidebarWidth}%`, gap: 26 }}>
          <aside style={{ padding: settings.customLayout === "sidebar" ? 18 : "0 18px 0 0", marginLeft: settings.customLayout === "sidebar" ? -18 : 0, color: settings.textColor, background: settings.customLayout === "sidebar" ? `${settings.accentColor}10` : "transparent", borderRight: settings.customLayout === "columns" ? "1px solid #E2E8F0" : "none" }}>
            <PreviewContent values={values} skills={skills} settings={settings} include={asideSections} />
          </aside>
          <main><PreviewContent values={values} skills={skills} settings={settings} include={mainSections} /></main>
        </div>
      </>
    );
  }

  if (fullBleedTemplates.has(settings.template)) {
    const isTechnical = settings.template === "technical";
    const isCreative = settings.template === "creative";
    const sidebarColor = isTechnical ? "#172033" : isCreative ? settings.accentColor : settings.accentColor;
    return (
      <div style={{ display: "grid", gridTemplateColumns: isTechnical ? "38% 62%" : "34% 66%", minHeight: 980 }}>
        <aside style={{ background: sidebarColor, color: "white", padding: isCreative ? "54px 30px" : "44px 28px", borderRight: isTechnical ? `7px solid ${settings.accentColor}` : "none" }}>
          {values.avatarDataUrl ? <AvatarImage values={values} settings={settings} inverted /> : null}
          {isCreative && <div style={{ width: 42, height: 7, background: "white", marginBottom: 24 }} />}
          <h1 style={{ fontSize: 29, lineHeight: 1.12, margin: 0 }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
          <div style={{ marginTop: 10, fontWeight: 700 }}>{values.professionalTitle || "Vị trí chuyên môn"}</div>
          <ContactDetails values={values} settings={settings} stacked inverted />
          {!settings.hiddenSections?.includes("skills") && skills.length > 0 && <SideSection title="KỸ NĂNG">{skills.map((skill) => <div key={skill} style={{ marginBottom: 8 }}>{skill}</div>)}</SideSection>}
          {!settings.hiddenSections?.includes("certificates") && (values.certificates || []).some((item) => item.name) && <SideSection title="CHỨNG CHỈ">{values.certificates?.filter((item) => item.name).map((item, index) => <div key={index} style={{ marginBottom: 10 }}><strong>{item.name}</strong><div style={{ opacity: 0.85 }}>{[item.issuer, item.year].filter(Boolean).join(" · ")}</div></div>)}</SideSection>}
        </aside>
        <main style={{ padding: isTechnical ? "44px 34px" : "44px 38px", color: settings.textColor }}>
          {isTechnical && <div style={{ color: settings.accentColor, fontSize: 11, fontWeight: 800, letterSpacing: ".12em", marginBottom: 22 }}>HỒ SƠ NĂNG LỰC</div>}
          {content}
        </main>
      </div>
    );
  }

  if (["corporate", "graduate", "compact"].includes(settings.template)) {
    const asideSections: SectionKey[] = settings.template === "graduate" ? ["education", "skills", "certificates"] : ["skills", "education", "certificates"];
    const mainSections: SectionKey[] = settings.sectionOrder.filter((section) => !asideSections.includes(section));
    return (
      <>
        <header style={{ background: settings.template === "corporate" ? settings.accentColor : `${settings.accentColor}12`, color: settings.template === "corporate" ? "white" : settings.textColor, margin: settings.template === "compact" ? "-30px -36px 24px" : "-44px -48px 30px", padding: settings.template === "compact" ? "24px 36px" : "30px 48px" }}>
          {values.avatarDataUrl ? <AvatarImage values={values} settings={settings} inverted={settings.template === "corporate"} /> : null}
          <h1 style={{ margin: 0, fontSize: settings.template === "compact" ? 27 : 31 }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
          <div style={{ marginTop: 5, fontSize: 16, fontWeight: 700 }}>{values.professionalTitle || "Vị trí chuyên môn"}</div>
          <ContactDetails values={values} settings={settings} inverted={settings.template === "corporate"} />
        </header>
        <div style={{ display: "grid", gridTemplateColumns: settings.template === "compact" ? "31% 69%" : "34% 66%", gap: settings.template === "compact" ? 22 : 30 }}>
          <aside style={{ paddingRight: 20, borderRight: "1px solid #E2E8F0" }}><PreviewContent values={values} skills={skills} settings={settings} include={asideSections} /></aside>
          <main><PreviewContent values={values} skills={skills} settings={settings} include={mainSections} /></main>
        </div>
      </>
    );
  }

  if (settings.template === "timeline") {
    return (
      <>
        <header style={{ borderLeft: `8px solid ${settings.accentColor}`, paddingLeft: 22, marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 33 }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
          <div style={{ color: settings.accentColor, fontSize: 17, fontWeight: 700, marginTop: 5 }}>{values.professionalTitle || "Vị trí chuyên môn"}</div>
          <ContactDetails values={values} settings={settings} />
        </header>
        <div style={{ borderLeft: `2px solid ${settings.accentColor}55`, paddingLeft: 24 }}>{content}</div>
      </>
    );
  }

  if (settings.template === "executive") {
    return (
      <>
        <header style={{ borderTop: `8px solid ${settings.accentColor}`, borderBottom: "1px solid #CBD5E1", padding: "24px 0 20px", marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 34 }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
          <div style={{ fontSize: 17, marginTop: 5 }}>{values.professionalTitle || "Vị trí quản lý"}</div>
          <ContactDetails values={values} settings={settings} />
        </header>
        {content}
      </>
    );
  }

  if (settings.template === "academic") {
    return (
      <>
        <header style={{ textAlign: "center", borderBottom: "2px double #94A3B8", paddingBottom: 18, marginBottom: 26 }}>
          <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 30, letterSpacing: ".03em" }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
          <div style={{ marginTop: 6, fontFamily: "Georgia, serif", fontSize: 15 }}>{values.professionalTitle || "Lĩnh vực chuyên môn"}</div>
          <ContactDetails values={values} settings={settings} />
        </header>
        {content}
      </>
    );
  }

  return (
    <>
      <header style={{ borderBottom: settings.template === "elegant" ? `1px solid ${settings.accentColor}` : settings.template === "minimal" ? "1px solid #CBD5E1" : `3px solid ${settings.accentColor}`, textAlign: settings.template === "elegant" ? "center" : "left", paddingBottom: 20, marginBottom: settings.density + 10 }}>
        {values.avatarDataUrl ? <AvatarImage values={values} settings={settings} /> : null}
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-0.03em" }}>{values.fullName || "HỌ VÀ TÊN"}</h1>
        <div style={{ color: settings.accentColor, fontSize: 17, fontWeight: 700, marginTop: 6 }}>{values.professionalTitle || "Vị trí chuyên môn"}</div>
        <ContactDetails values={values} settings={settings} />
      </header>
      {content}
    </>
  );
}

export function PreviewContent({ values, skills, settings, include }: { values: CvBuilderValues; skills: string[]; settings: BuilderSettings; include?: SectionKey[] }) {
  const paragraphStyle: CSSProperties = { whiteSpace: "pre-line", lineHeight: 1.55, color: settings.textColor, margin: "6px 0 0", fontSize: settings.fontSize };
  const sections: Record<SectionKey, ReactNode> = {
    summary: values.summary ? <CvSection title="MỤC TIÊU NGHỀ NGHIỆP" settings={settings}><p style={paragraphStyle}>{values.summary}</p></CvSection> : null,
    experience: (values.experience || []).some((item) => item.company || item.position || item.description) ? <CvSection title="KINH NGHIỆM LÀM VIỆC" settings={settings}>{values.experience?.filter((item) => item.company || item.position || item.description).map((item, index) => <PreviewEntry key={index} title={item.position || "Vị trí công việc"} subtitle={item.company} period={item.period} description={item.description} settings={settings} />)}</CvSection> : null,
    education: (values.education || []).some((item) => item.school || item.major) ? <CvSection title="HỌC VẤN" settings={settings}>{values.education?.filter((item) => item.school || item.major).map((item, index) => <PreviewEntry key={index} title={item.school || "Trường / Cơ sở đào tạo"} subtitle={item.major} period={item.period} settings={settings} />)}</CvSection> : null,
    projects: (values.projects || []).some((item) => item.name || item.description) ? <CvSection title="DỰ ÁN" settings={settings}>{values.projects?.filter((item) => item.name || item.description).map((item, index) => <PreviewEntry key={index} title={item.name || "Tên dự án"} subtitle={[item.role, item.link].filter(Boolean).join(" · ")} description={item.description} settings={settings} />)}</CvSection> : null,
    skills: !fullBleedTemplates.has(settings.template) && skills.length > 0 ? <CvSection title="KỸ NĂNG" settings={settings}><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{skills.map((skill) => <span key={skill} style={{ padding: "4px 9px", borderRadius: 5, background: `${settings.accentColor}12`, color: settings.accentColor, fontSize: settings.fontSize - 1, fontWeight: 700 }}>{skill}</span>)}</div></CvSection> : null,
    certificates: !fullBleedTemplates.has(settings.template) && (values.certificates || []).some((item) => item.name) ? <CvSection title="CHỨNG CHỈ" settings={settings}>{values.certificates?.filter((item) => item.name).map((item, index) => <PreviewEntry key={index} title={item.name || ""} subtitle={item.issuer} period={item.year} settings={settings} />)}</CvSection> : null,
  };
  const hiddenSections = settings.hiddenSections || [];
  const visibleSections = (include || settings.sectionOrder).filter((section) => !hiddenSections.includes(section));
  return <>{visibleSections.map((section) => <div key={section}>{sections[section]}</div>)}</>;
}

function PreviewEntry({ title, subtitle, period, description, settings }: { title: string; subtitle?: string; period?: string; description?: string; settings: BuilderSettings }) {
  return <div style={{ marginBottom: 15, color: settings.textColor, breakInside: "avoid", pageBreakInside: "avoid" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><strong style={{ fontSize: settings.fontSize + 0.5 }}>{title}</strong><span style={{ color: settings.textColor, opacity: 0.7, fontSize: settings.fontSize - 1, whiteSpace: "nowrap" }}>{period}</span></div>{subtitle && <div style={{ color: settings.accentColor, fontWeight: 600, fontSize: settings.fontSize - 0.5, marginTop: 2 }}>{subtitle}</div>}{description && <p style={{ whiteSpace: "pre-line", lineHeight: 1.55, color: settings.textColor, fontSize: settings.fontSize, margin: "5px 0 0" }}>{description}</p>}</div>;
}

function CvSection({ title, settings, children }: { title: string; settings: BuilderSettings; children: ReactNode }) {
  return <section style={{ marginBottom: settings.density }}><h2 style={{ fontSize: settings.headingSize, letterSpacing: "0.08em", color: settings.accentColor, margin: "0 0 10px", paddingBottom: 6, borderBottom: `1px solid ${settings.accentColor}55` }}>{title}</h2>{children}</section>;
}

function SideSection({ title, children }: { title: string; children: ReactNode }) {
  return <section style={{ marginTop: 30, fontSize: 12 }}><h2 style={{ fontSize: 12, letterSpacing: "0.09em", borderBottom: "1px solid rgba(255,255,255,.45)", paddingBottom: 7 }}>{title}</h2>{children}</section>;
}

function AvatarImage({ values, settings, inverted = false }: { values: CvBuilderValues; settings: BuilderSettings; inverted?: boolean }) {
  if (!values.avatarDataUrl) return null;
  const radius = settings.avatarShape === "circle" ? "50%" : settings.avatarShape === "rounded" ? 14 : 0;
  return <img src={values.avatarDataUrl} alt="Ảnh đại diện" style={{ display: "block", width: settings.avatarSize, height: settings.avatarSize, objectFit: "cover", borderRadius: radius, margin: settings.avatarPosition === "left" ? "0 auto 18px 0" : "0 0 18px auto", border: `3px solid ${inverted ? "rgba(255,255,255,.72)" : `${settings.accentColor}33`}` }} />;
}

function ContactDetails({ values, settings, stacked = false, inverted = false }: { values: CvBuilderValues; settings: BuilderSettings; stacked?: boolean; inverted?: boolean }) {
  const contacts = [
    { value: values.email, icon: <MailOutlined /> },
    { value: values.phone, icon: <PhoneOutlined /> },
    { value: values.address, icon: <EnvironmentOutlined /> },
    { value: values.website, icon: <LinkOutlined /> },
  ].filter((item) => item.value);
  if (!contacts.length) return <div style={{ marginTop: 10, opacity: .65, fontSize: 12 }}>Email • Số điện thoại • Địa chỉ</div>;
  return (
    <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", flexWrap: "wrap", gap: stacked ? 7 : "6px 14px", marginTop: stacked ? 28 : 10, color: inverted ? "white" : settings.textColor, opacity: inverted ? .9 : .72, fontSize: 11.5, lineHeight: 1.5 }}>
      {contacts.map((item) => <span key={item.value} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{settings.showContactIcons ? item.icon : null}<span>{item.value}</span></span>)}
    </div>
  );
}

async function resizeImage(file: File, maxSize: number, quality: number): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function TemplateThumbnail({ layout, color }: { layout: "single" | "sidebar" | "columns" | "timeline"; color: string }) {
  const line = (width: string, key: string) => <span key={key} style={{ display: "block", width, height: 2, marginBottom: 4, borderRadius: 2, background: "#CBD5E1" }} />;
  return (
    <span style={{ display: "block", height: 72, padding: 10, background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
      <span style={{ display: "grid", gridTemplateColumns: layout === "sidebar" ? "31% 69%" : layout === "columns" ? "42% 58%" : "1fr", height: "100%", gap: layout === "single" || layout === "timeline" ? 0 : 6, background: "#FFFFFF", border: "1px solid #E2E8F0", padding: layout === "sidebar" ? 0 : 6 }}>
        {layout === "sidebar" && <span style={{ display: "block", background: color, opacity: .9 }} />}
        {layout === "timeline" && <span style={{ position: "absolute", width: 2, height: 38, margin: "8px 0 0 4px", background: color }} />}
        <span style={{ display: "block", padding: layout === "sidebar" ? 6 : 0 }}>
          <span style={{ display: "block", width: "58%", height: 4, marginBottom: 6, borderRadius: 2, background: color }} />
          {line("92%", "a")}{line("75%", "b")}{line("88%", "c")}{line("62%", "d")}
        </span>
      </span>
    </span>
  );
}

function TemplateCard({ template, selected, color, onSelect }: {
  template: (typeof templateOptions)[number];
  selected: boolean;
  color: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      style={{ padding: 0, overflow: "hidden", textAlign: "left", cursor: "pointer", background: "#FFFFFF", border: selected ? `2px solid ${color}` : "1px solid #E2E8F0", borderRadius: 12, boxShadow: selected ? `0 0 0 3px ${color}14` : "none" }}
    >
      <TemplateThumbnail layout={template.layout} color={selected ? color : "#94A3B8"} />
      <span style={{ display: "block", padding: "10px 12px" }}>
        <span style={{ display: "block", color: "#0F172A", fontSize: 13, fontWeight: 700 }}>{template.name}</span>
        <span style={{ display: "block", color: "#64748B", fontSize: 11, lineHeight: 1.4, marginTop: 3 }}>{template.description}</span>
      </span>
    </button>
  );
}

const sectionLabels: Record<SectionKey, string> = {
  summary: "Mục tiêu",
  experience: "Kinh nghiệm",
  education: "Học vấn",
  projects: "Dự án",
  skills: "Kỹ năng",
  certificates: "Chứng chỉ",
};
