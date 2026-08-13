import { createRoot } from "react-dom/client";
import type { CvBuilderDocumentDetail } from "../services/cvBuilderService";
import {
  CvPreview,
  defaultSettings,
  normalizeCvValues,
  type BuilderSettings,
  type CvBuilderValues,
} from "../pages/CvBuilderPage/CvBuilderPage";

export async function createCvBuilderPdf(
  document: CvBuilderDocumentDetail<CvBuilderValues, BuilderSettings>,
): Promise<File> {
  const values = normalizeCvValues(document.content);
  const settings = { ...defaultSettings, ...document.settings, zoom: 100 };
  const skills = (values.skills || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  const host = window.document.createElement("div");
  Object.assign(host.style, {
    position: "fixed", left: "-10000px", top: "0", width: "210mm",
    minHeight: "297mm", background: "#fff", zIndex: "-1",
  });
  window.document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(
      <div
        style={{
          width: "210mm",
          minHeight: "297mm",
          boxSizing: "border-box",
          background: "#FFFFFF",
          color: settings.textColor,
          fontFamily: settings.fontFamily,
          fontSize: settings.fontSize,
          padding: settings.template === "modern" ? 0 : "44px 48px",
          overflow: "visible",
        }}
      >
        <CvPreview values={values} skills={skills} settings={settings} />
      </div>,
    );
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;
    const worker = (html2pdf as any)().set({
      margin: 0,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FFFFFF", logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    }).from(host.firstElementChild);
    const blob = await worker.outputPdf("blob") as Blob;
    const safeName = (document.name.trim() || "CV").replace(/[\\/:*?"<>|]+/g, "-");
    return new File([blob], `${safeName}.pdf`, { type: "application/pdf" });
  } finally {
    root.unmount();
    host.remove();
  }
}
