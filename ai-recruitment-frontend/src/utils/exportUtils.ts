/**
 * Utility cho phép xuất dữ liệu ra file CSV mở chuẩn trên MS Excel (hỗ trợ Tiếng Việt UTF-8)
 * và tạo cửa sổ in/xuất PDF định dạng chuẩn B2B SaaS.
 */

export function exportToCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const sanitize = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(sanitize).join(",");
  const bodyLines = rows.map((row) => row.map(sanitize).join(",")).join("\n");
  const csvContent = "\uFEFF" + headerLine + "\n" + bodyLines;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadElementAsPdf(element: HTMLElement, filename: string, margin: [number, number, number, number] = [10, 10, 10, 10]) {
  const clone = element.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, { display: "block", position: "static", width: "190mm", maxWidth: "none", background: "#FFFFFF" });
  const host = document.createElement("div");
  Object.assign(host.style, { position: "fixed", left: "-12000px", top: "0", width: "210mm", background: "#FFFFFF", zIndex: "-1" });
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    const module = await import("html2pdf.js");
    const html2pdf = module.default || module;
    await (html2pdf as any)().set({
      margin,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FFFFFF", logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".pdf-keep"] },
    }).from(clone).save();
  } finally {
    host.remove();
  }
}

const escapeHtml = (value: unknown) => String(value ?? "-")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

export async function exportToPdfPrint(title: string, subtitle: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const report = document.createElement("section");

  const html = `
      <style>
        .pdf-table-report {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 30px;
          color: #0F172A;
          background: #FFFFFF;
        }
        .header {
          border-bottom: 2px solid #2563EB;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 22px;
          color: #0F172A;
          margin: 0 0 6px 0;
        }
        .subtitle {
          font-size: 13px;
          color: #64748B;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        th, td {
          border: 1px solid #E2E8F0;
          padding: 10px 14px;
          text-align: left;
          font-size: 13px;
        }
        th {
          background-color: #F8FAFC;
          color: #334155;
          font-weight: 700;
        }
        tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        .footer {
          margin-top: 32px;
          font-size: 11px;
          color: #94A3B8;
          text-align: right;
        }
      </style>
      <div class="pdf-table-report">
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">${escapeHtml(subtitle)} · Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <div class="footer">Xuất tự động từ Hệ thống Tuyển dụng AI Insight</div>
      </div>
  `;
  report.innerHTML = html;
  const safeFilename = title.replace(/[\\/:*?"<>|]+/g, "-").trim() || "Bao-cao";
  await downloadElementAsPdf(report, `${safeFilename}.pdf`, [8, 8, 8, 8]);
}

/**
 * Chuẩn hóa chuỗi Tiếng Việt: loại bỏ toàn bộ dấu thanh/dấu phụ, 
 * chuyển về chữ thường để hỗ trợ tìm kiếm linh hoạt (Accents-Insensitive Search).
 * Ví dụ: "Lập trình" -> "lap trinh", "Hồ Đức" -> "ho duc"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return result.trim();
}
