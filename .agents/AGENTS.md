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

## 5. Scope Note: `design-taste-frontend` Skill
This project is a **dense B2B admin/dashboard product** (tables, forms, multi-step workflows), which the `design-taste-frontend` skill explicitly lists as **out of scope** (its Section 13). Do NOT blindly apply its landing-page vocabulary here:
* **Do NOT apply:** hero stack rules, eyebrow-count limits, marquee caps, zigzag alternation caps, bento cell-count rules, logo-wall rules, quote-line caps. These exist for marketing pages, not for `ApplicationManagementPage`, `JobApprovalPage`, dashboards, etc.
* **DO apply (these generalize to any UI):** icon library discipline, motion timing/easing discipline, button contrast checks, form contrast checks, empty/loading/error state coverage, shape/color consistency locks, reduced-motion support, hardware-accelerated animation (`transform`/`opacity` only), copy self-audit for typos/broken Vietnamese phrasing.

## 6. Icon & Motion Discipline
* **Icon library:** `@ant-design/icons` only (already a dependency). Never hand-roll SVG icon paths from scratch — if a glyph is missing, compose from existing Ant Design icons or ask before adding a new icon package.
* **Motion timing tokens:** Standardize all CSS transitions/animations on:
  * `durationFast: 150ms` — hover states, button press feedback
  * `durationBase: 250ms` — panel/drawer open-close, tab switches
  * `easing: cubic-bezier(0.16, 1, 0.3, 1)` — the only easing curve used project-wide (matches the entry-stagger pattern already used in `ScrollReveal`)
* **Animate only `transform` and `opacity`.** Never animate `top`, `left`, `width`, `height`, or `margin` — these trigger layout reflow and feel janky, especially on lower-end machines used to run local dev/demo builds.
* **Tactile feedback on `:active`:** buttons/cards that are clickable should use `scale(0.98)` or `translateY(1px)` on press, not just a color change.
* **Reduced motion:** any animation more elaborate than a simple hover/fade must respect `prefers-reduced-motion` — degrade to an instant state change.
* **Entry-stagger for card grids:** when a page renders a list of `StatCard` or similar summary cards, stagger their entry animation by 60-80ms per card (CSS `animation-delay: calc(var(--i) * 70ms)` is sufficient — no JS animation library required for this).

## 7. Component State Coverage (mandatory for every data view)
Every page that fetches or displays data (tables, dashboards, candidate/job lists) must implement all four states, not just the "happy path":
* **Loading:** Ant Design `<Skeleton>` shaped to match the final layout (e.g. skeleton rows matching table columns), not a generic centered `<Spin>` floating in empty space.
* **Empty:** Use `EmptyState.tsx` with a specific, actionable message per context (e.g. "Chưa có ứng viên nào ứng tuyển" + a suggestion), never the bare Ant Design default "No Data".
* **Error:** Inline, contextual messaging near the failed section — do not silently fail to a blank screen. Toasts (`message.error`) are for transient actions only, not for page-load failures.
* **Populated (default):** the state most already covered — no additional rule beyond what's already built.

## 8. Consistency Locks
* **Shape lock:** one corner-radius scale for the whole app. Use `appTheme.radius` (`sm: 8`, `md: 12`, `lg: 16`, `xl: 20`) — do not invent new radius values inline (e.g. `borderRadius: 10` or `14` scattered in one-off components).
* **Color lock:** once a semantic color is picked for a status (success/warning/error/info), it is used identically everywhere that status appears. Do not let one page render "Approved" in green and another render the same status in blue.
* **Shadow lock:** use `appTheme.shadow` tokens (`card`, `dropdown`, `panel`) instead of writing new `boxShadow` rgba values inline. If elevation is tinted, always tint toward Slate-900 (`rgba(15, 23, 42, ...)`), never pure black (`rgba(0, 0, 0, ...)`).
* **Theme lock:** the app is light-mode only. Dark surfaces (`#0F172A`, `#1E293B`) are reserved for the header/footer of `PublicLayout` and similar deliberate accent bands — never introduce a dark-mode toggle or a randomly-inverted section elsewhere.

## 9. Pre-Flight Checklist (run before considering any UI task "done")
- [ ] No pure black (`#000000`) anywhere — use `#0F172A` (Slate-900) per the palette.
- [ ] Every button's text is readable against its background (no white-on-white, no ghost button with no border over a busy background).
- [ ] Every data view has loading + empty + error states, not just the populated state.
- [ ] No card-inside-card-inside-card nesting — group with borders/spacing per Section 3 instead.
- [ ] No hardcoded hex colors that duplicate an existing `appTheme` token — reuse the token.
- [ ] Any new animation only touches `transform`/`opacity` and respects `prefers-reduced-motion`.
- [ ] Terminology from Section 4 used correctly (no reverted old terms).
- [ ] `npx tsc --noEmit` passes with zero errors before calling any UI change complete.
