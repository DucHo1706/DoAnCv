---
name: style_guide
description: Guidelines for frontend development styling in this recruitment project to ensure UI consistency and prevent ad-hoc dark themes or mismatched designs.
---

# Project Style Guide & UI Consistency Rules

Ensure all frontend styling, component states, and theme elements align perfectly with the host application's design system.

## 1. Base Theme Configuration (appTheme)
Use values from `src/constants/theme.ts` to style UI components:
* **Background:** Slate light `#F8FAFC`. Avoid introducing custom dark slate/indigo backgrounds unless requested.
* **Surface Containers:** White `#FFFFFF`.
* **Borders:** Subtle grey/slate `#E2E8F0` (`1px solid #E2E8F0`).
* **Primary Branding Color:** `#2563EB` (Royal Blue) for standard active links, buttons, progress indicators.
* **Text Hierarchy:**
  * Primary Text: Slate-900 `#0F172A`
  * Secondary Text: Slate-500 `#64748B`

## 2. Component Design & Layout
* **Cards & Containers:** Always use white background cards with a thin grey border (`border: 1px solid #E2E8F0`), soft rounded corners (`borderRadius: 12px` or `16px`), and subtle shadow.
* **Alerts & Messages:** Use built-in Ant Design `<Alert>` or light-colored alerts (`#F8FAFC`) with appropriate borders. Do not use high-saturation backgrounds.
* **Gauges & Indicators:** Use primary and semantic tokens (`#16A34A` for success/match, `#F59E0B` for warnings, `#DC2626` for error) on a clean, light surface.
* **Spacing:** Standardize on margins and padding of `16px` (medium) or `24px` (large).

## 3. Avoid "AI-Like" Ad-hoc Designs
* **No unsolicited Dark Themes:** Do not create neon gradients on black/slate backgrounds if the rest of the application is a clean light-themed layout.
* **No redundant decoration:** Eliminate unnecessary decorative badges, icons, and illustrations. Focus on structured, readable data tables, tags, and progress bars.
