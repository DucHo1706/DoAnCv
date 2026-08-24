import type { CvBuilderValues } from "../pages/CvBuilderPage/CvBuilderPage";

export function buildCvBuilderText(values: CvBuilderValues): string {
  const lines: string[] = [];
  const add = (label: string, value?: string) => {
    const normalized = value?.trim();
    if (normalized) lines.push(`${label}: ${normalized}`);
  };

  add("Họ và tên", values.fullName);
  add("Vị trí chuyên môn", values.professionalTitle);
  add("Email", values.email);
  add("Số điện thoại", values.phone);
  add("Địa chỉ", values.address);
  add("Website hoặc LinkedIn", values.website);
  add("Mục tiêu nghề nghiệp", values.summary);
  add("Kỹ năng", values.skills);

  values.experience?.forEach((item, index) =>
    add(`Kinh nghiệm ${index + 1}`, [item.position, item.company, item.period, item.description].filter(Boolean).join(" | "))
  );
  values.education?.forEach((item, index) =>
    add(`Học vấn ${index + 1}`, [item.school, item.major, item.period].filter(Boolean).join(" | "))
  );
  values.projects?.forEach((item, index) =>
    add(`Dự án ${index + 1}`, [item.name, item.role, item.description, item.link].filter(Boolean).join(" | "))
  );
  values.certificates?.forEach((item, index) =>
    add(`Chứng chỉ ${index + 1}`, [item.name, item.issuer, item.year].filter(Boolean).join(" | "))
  );

  return lines.join("\n");
}
