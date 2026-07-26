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

export function exportToPdfPrint(title: string, subtitle: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
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
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="subtitle">${subtitle} · Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              ${row.map((cell) => `<td>${cell ?? "-"}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <div class="footer">Xuất tự động từ Hệ thống Tuyển dụng AI Insight</div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
