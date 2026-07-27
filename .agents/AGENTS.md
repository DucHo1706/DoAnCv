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

---

## 10. Page Architecture Rules (discovered from full codebase audit — 2026-07-27)

These rules were extracted after auditing all 30+ TSX pages to prevent repeating the structural mistakes found in `ApplicationManagementPage`.

### 10.1 One Route = One Page = One Responsibility
- **NEVER** use a state variable (e.g., `selectedJobId`, `selectedTab`) to conditionally render two completely different screens inside a single component. That is two pages masquerading as one.
- **Pattern to follow (Admin side):** `JobApprovalPage` handles jobs list. `CandidateDetailPage` handles candidate details. Each has its own URL. Each is independently loadable, bookmarkable, and refreshable.
- **Violation found:** `ApplicationManagementPage.tsx` (1,779 lines, 67KB) uses `selectedJobId === null ? renderJobCampaigns() : renderApplicationsList()` — two completely different screens on one URL `/recruiter/applications`. This MUST be split into:
  - `/recruiter/applications` → `JobCampaignListPage` (danh sách chiến dịch)
  - `/recruiter/applications/:jobId` → `CampaignApplicationsPage` (ứng viên của 1 chiến dịch)

### 10.2 Hook Size Limit — 300 Lines Max
- A single custom hook must not exceed **300 lines**. If it does, it is combining concerns that belong in separate hooks.
- **Violation found:** `useApplicationManagement.ts` is **634 lines** and manages: job list data, application data, ranking/comparison, kanban state, reject modal state, schedule modal state, SignalR connection — all in one hook. Split into:
  - `useJobCampaigns.ts` — job list, stats, filter, sort, pagination
  - `useCampaignApplications.ts` — applications, ranking, kanban, filters
  - `useRejectModal.ts` — reject flow (or inline inside page)
  - `useScheduleModal.ts` — schedule flow (or inline inside page)

### 10.3 Never Call React Hooks Inside Non-Component Functions or IIFEs
- **Critical violation found in `ApplicationManagementPage.tsx` line 1671:**
  ```tsx
  {(() => {
    useEffect(() => { ... }, [scheduleModalOpen]);  // ❌ ILLEGAL — Rules of Hooks
    return <Form>...</Form>;
  })()}
  ```
- `useEffect`, `useState`, `useMemo`, and all other hooks MUST ONLY be called at the top level of a React function component or a custom hook. Never inside callbacks, IIFE, conditional blocks, loops, or helper functions.
- **Fix:** Extract the schedule modal body into its own component `<ScheduleModalContent />` and move the `useEffect` there.

### 10.4 URL State > Component State for Navigation Context
- If a user can "navigate into" a sub-context (e.g., clicking into a job campaign to see its applicants), that context MUST be reflected in the URL via route params (`/recruiter/applications/:jobId`), not via a `useState` variable.
- **Why:** Current implementation breaks browser back button, refresh, and copy-paste URL sharing. The job campaign list page reinitializes its state on every render because there is no URL-based hydration.
- **Current workaround (still wrong):** `useApplicationManagement.ts` line 23–26 reads `window.location.search` directly instead of using `useParams()` or `useSearchParams()` — this is brittle and bypasses React Router's reactivity.

### 10.5 Component File Size Limit — 500 Lines Max
- A single TSX component file must not exceed **500 lines**. Beyond that, extract sub-components.
- **Violations found (audit results):**
  | File | Lines | Action Required |
  |---|---|---|
  | `ApplicationManagementPage.tsx` | 1,779 | Split into 2 pages + extract modals |
  | `JobApprovalPage.tsx` | 1,153 | Extract `JobDetailDrawer`, `RejectModal`, `GridView`, `TableView` |
  | `CandidateProfilePage.tsx` | ~900 | Already partially extracted to tabs — continue |
  | `MainLayout.tsx` | 796 | Extract `SideNav`, `NotificationPopover`, `ProfileDropdown` |
- **How to split:** Extract each logical chunk (Table view, Grid view, Detail modal/drawer, sub-filters) into its own file within a `components/` subfolder inside the page directory.

### 10.6 No Inline onMouseEnter/onMouseLeave Style Mutations
- **Violations found in:** `ApplicationManagementPage.tsx` (Kanban cards), `CandidateProfilePage.tsx`, `ApplicationTrendChart.tsx`, `TopCandidateLeaderboard.tsx`, `JobDetailContent.tsx`
- Avoid `onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}` — these bypass React's rendering, cause inconsistent state, and defeat reduced-motion support.
- **Use instead:** CSS classes from `index.css` (`.hover-card`, `.entry-anim`) or Ant Design's `hoverable` card prop. The design system's `.hover-card` class in `index.css` already implements the correct `transform` + `box-shadow` transition with `prefers-reduced-motion` fallback.

---

## 11. Loading State Rules — Skeleton First (discovered from audit)

**Critical finding:** 43+ uses of `<Spin>` found across the codebase but only 5 files use `<Skeleton>`. The majority of pages show a floating `<Spin size="large" />` in empty space on page load — this violates Section 7 and creates jarring layout shifts.

### 11.1 Mandatory Skeleton Pattern
Every page that fetches data on mount MUST use `<Skeleton>` shaped to match the final layout during loading, NOT a centered `<Spin>`. Examples:
- **Table pages** (`JobApprovalPage`, `UserManagementPage`, etc.): Use `<Skeleton.Table rowCount={8} />` or Ant Design `<Table loading={true} />` (which renders skeleton rows automatically — prefer this).
- **Card grid pages** (`JobCampaignListPage`): Use 6x `<Skeleton.Card />` placeholder cards in the same grid layout.
- **Detail/profile pages** (`CandidateDetailPage`, `RecruiterJobDetailPage`): Use `<Skeleton active paragraph={{ rows: 8 }} />`.

### 11.2 When `<Spin>` IS Acceptable
`<Spin>` is only appropriate for:
- **Inline action feedback** — e.g., inside a button while an API call is in progress (`loading={submitting}`), or a small spinner next to a specific section being refreshed.
- **AI processing overlays** — where the AI model is actively running and no skeleton layout is available (e.g., `EmailCandidatePage` AI email composition). Even here, use a branded loading indicator, not the default Ant Design spinner.
- **Never** for full page loads on mount.

### 11.3 Error State = Inline Alert, Not Toast
- Page-load failures MUST show an inline `<Alert type="error" />` near the failed section (e.g., below the page title), not `message.error(...)` which auto-dismisses and is invisible on large screens.
- **Violations found:** `fetchData` in `useApplicationManagement.ts` (line 221), `fetchAdminJobs` in `JobApprovalPage.tsx` (line 96), `InterviewSchedulePage`, `EmailLogsPage`, `CandidateDashboardPage` — all call `message.error(...)` on page-load failure and then show nothing.
- `message.error` IS allowed for: status-change actions, form submissions, button-triggered mutations — transient user actions.

---

## 12. Updated Pre-Flight Checklist (replaces Section 9 — run before any UI task is "done")
- [ ] No pure black (`#000000`) anywhere — use `#0F172A` (Slate-900) per the palette.
- [ ] `rgba(0, 0, 0, ...)` shadow tints are BANNED — use `rgba(15, 23, 42, ...)` (Slate-900 tint).
- [ ] Every button's text is readable against its background (no white-on-white, no ghost button with no border over a busy background).
- [ ] Every data view has **all four states**: loading (Skeleton) + empty (EmptyState) + error (inline Alert) + populated.
- [ ] No card-inside-card-inside-card nesting — group with borders/spacing per Section 3 instead.
- [ ] No hardcoded hex colors that duplicate an existing `appTheme` token — reuse the token.
- [ ] No hardcoded `borderRadius` values outside of `appTheme.radius` scale (`sm:8, md:12, lg:16, xl:20`). Tags use `sm:8` only. No `borderRadius: 4`, `14`, `24`, `30` unless it is a pill/circular shape.
- [ ] Any new animation only touches `transform`/`opacity` and respects `prefers-reduced-motion`. Use `.hover-card` or `.entry-anim` classes from `index.css` — do NOT use inline `onMouseEnter` style mutations.
- [ ] Terminology from Section 4 used correctly (no reverted old terms).
- [ ] Every new page renders **max 500 lines** per TSX file — extract sub-components to `components/` subfolder if exceeded.
- [ ] No custom hook exceeds **300 lines** — split into single-concern hooks if exceeded.
- [ ] React Hooks are ONLY called at the top level of components or custom hooks — NEVER inside IIFE, callbacks, conditions, or render functions.
- [ ] If the user can "navigate into" a sub-context, it has its own URL route (not a conditional `if (state)` render).
- [ ] `npx tsc --noEmit` passes with zero errors before calling any UI change complete.
