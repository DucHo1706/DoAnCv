# Project UI & Styling Guidelines (Recruitment App)

Ensure all frontend UI development, refactoring, and styling follow these project-scoped guidelines to maintain consistency and high-quality aesthetics.

## 1. Color Palette & Typography
* **Page Background:** Slate Light `#F8FAFC`. Avoid dark slate or dark neon backgrounds unless explicitly requested.
* **Surface Containers:** White `#FFFFFF`.
* **Subtle Borders:** Light Slate `#E2E8F0` (`1px solid #E2E8F0` or `rgba(226, 232, 240, 0.8)`).
* **Primary Brand Accent:** Royal Blue `#2563EB` for primary buttons, active links, progress bars, and tabs.
* **Semantic Colors:**
  * Success/Perfect Match: Emerald Green `#10B981` (backgrounds: `#F0FDF4`, borders: `#BBF7D0`)
  * Warning/Notice: Amber Orange `#F59E0B` (backgrounds: `#FFFBEB`, borders: `#FDE68A`)
  * Error/Red Flag: Crimson Red `#EF4444` (backgrounds: `#FEF2F2`, borders: `#FECACA`)
* **Text Hierarchy:**
  * Primary Headings & Bold Text: `#0F172A` (Slate-900)
  * Secondary Descriptive Text: `#64748B` (Slate-500)

## 2. Glassmorphism Styling (Light Fluent Theme)
When premium glassmorphism is requested, implement the Light Fluent aesthetic:
```typescript
const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
  borderRadius: "16px"
};
```

## 3. Grid & Layout Integrity
* **No Squishing:** Always use wide containers (e.g., `maxWidth: 1300` or full-width) for layout grids.
* **Wrap Text Safety:** Never use static CSS Grid definitions like `gridTemplateColumns: "1fr auto 1fr"` for dynamic text lists. Always use Ant Design's `<Row>` and `<Col>` components with explicit column span weights (e.g. `span={11}` for left/right, `span={2}` for separators) to prevent layout overflows and text cut-off bugs.

## 4. Distinct Terminology
To avoid plagiarism issues, use unique SaaS terms:
* **Competency Matching:** Use "Năng lực & Cảnh báo" instead of "Đối sánh Kỹ năng".
* **Language Authenticity:** Use "Ngôn từ & Chân thực" instead of "Kiểm soát Định kiến".
* **Interview Coaching:** Use "Gợi ý phỏng vấn" instead of "Chiến lược Phỏng vấn".
