# Project UI & Styling Guidelines (Recruitment App)

Ensure all frontend UI development, refactoring, and styling follow these project-scoped guidelines and the newly installed `design-taste-frontend` skill rules to achieve a high-end, premium B2B SaaS layout instead of a generic job application board.

## 1. Core Config Dials (tasteskill)
Apply these dials for all interface generations:
* **`DESIGN_VARIANCE: 6`** (Linear-clean, structured, professional layout splits)
* **`MOTION_INTENSITY: 5`** (Smooth transitions, entry staggers, tactile hover & active feedback)
* **`VISUAL_DENSITY: 4`** (Generous spacing, slate-light breathing room)

## 2. Color Palette & Typography
* **Page Background:** Slate Light `#F8FAFC`. Avoid pure black or dark neon backgrounds unless explicitly requested.
* **Surface Containers:** White `#FFFFFF` with glassmorphic depth (`background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)"`).
* **Subtle Borders:** Light Slate `#E2E8F0` or `rgba(226, 232, 240, 0.8)`.
* **Primary Brand Accent:** Royal Blue `#2563EB` for active indicators, primary CTAs, and accents.
* **Semantic Colors:**
  * Success/Perfect Match: Emerald Green `#10B981` (backgrounds: `#F0FDF4`, borders: `#BBF7D0`)
  * Warning/Notice: Amber Orange `#F59E0B` (backgrounds: `#FFFBEB`, borders: `#FDE68A`)
  * Error/Red Flag: Crimson Red `#EF4444` (backgrounds: `#FEF2F2`, borders: `#FECACA`)
* **Typography:**
  * Use clean modern typography (e.g. Inter, Outfit, or Geist) with professional tracking and leading.
  * Primary Headings & Bold Text: `#0F172A` (Slate-900)
  * Secondary Descriptive Text: `#64748B` (Slate-500)

## 3. Layout, Grid & Component Integrity
* **No Squishing:** Always use wide containers (e.g., `maxWidth: 1300` or full-width) for layout grids.
* **Wrap Text Safety:** Always use proper flex layouts or explicit grids to prevent text cut-off.
* **SaaS Layout Rhythms:** Group sections with negative space, thin borders, and avoid cards-inside-cards-inside-cards UI.
* **Tactile Feedback:** Use micro-interactions (e.g. slightly scaling down buttons on click, hover opacity changes) to simulate physical touch.

## 4. Distinct Terminology
To maintain authenticity and avoid plagiarism, strictly use these SaaS terms:
* **Competency Matching:** Use "Năng lực & Cảnh báo" instead of "Đối sánh Kỹ năng".
* **Language Authenticity:** Use "Ngôn từ & Chân thực" instead of "Kiểm soát Định kiến".
* **Interview Coaching:** Use "Gợi ý phỏng vấn" instead of "Chiến lược Phỏng vấn".
