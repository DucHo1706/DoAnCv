# FRONTEND ARCHITECTURE & DIRECTORY STRUCTURE GUIDELINES

Dự án Frontend **AI Recruitment System** (`ai-recruitment-frontend`) áp dụng kiến trúc **Feature-Based / Component-Driven Architecture**.

---

## 1. Cấu trúc thư mục tổng quan (Directory Overview)

```text
ai-recruitment-frontend/
├── public/                    # Static assets (images, icons, favicon)
├── src/
│   ├── components/            # Components dùng chung (Common UI: PageContainer, StatCard, Custom Table, v.v.)
│   ├── constants/             # Hằng số hệ thống, token màu sắc (theme.ts, endpoints.ts)
│   ├── layouts/               # Các layout chính (MainLayout.tsx, PublicLayout.tsx)
│   ├── mock/                  # Dữ liệu giả lập cho testing / fallback
│   ├── pages/                 # Phân vùng theo Domain nghiệp vụ
│   │   ├── admin/             # Trang Quản trị hệ thống (Admin Portal)
│   │   │   ├── AdminDashboardPage/
│   │   │   ├── ReportsPage/
│   │   │   └── ...
│   │   ├── auth/              # Trang Xác thực (Login, Register, ForgotPassword)
│   │   ├── candidate/         # Trang Dành cho Ứng viên (Candidate Portal)
│   │   └── recruiter/         # Trang Dành cho Nhà tuyển dụng / HR (HR Portal)
│   │       ├── RecruiterDashboardPage/
│   │       ├── CVRankingPage/
│   │       ├── CandidateDetailPage/
│   │       └── ...
│   ├── routes/                # Cấu hình Route ứng dụng (React Router v6)
│   ├── services/              # Các hàm gọi API (Axios services, authService, recruiterService, v.v.)
│   ├── App.tsx                # App Root component & Router Provider
│   ├── index.css              # Global Design Tokens & Base Stylesheet
│   └── main.tsx               # Entry point ứng dụng React + Ant Design ConfigProvider
├── README.md                  # Hướng dẫn chạy & Tổng quan dự án
└── FRONTEND_ARCHITECTURE.md   # Quy chuẩn kiến trúc & cấu trúc thư mục (File này)
```

---

## 2. Quy chuẩn cấu trúc một Trang (Feature Page Standard)

Mỗi trang tính năng phức tạp thuộc `src/pages/<domain>/` sẽ được đóng gói thành một thư mục tự chứa (Self-contained Directory):

```text
src/pages/<domain>/<FeaturePageName>/
├── index.ts                           # Barrel export duy nhất
├── <FeaturePageName>.tsx              # View Orchestrator & Layout (Grid, Row, Col, Card)
├── hooks/                             # Custom hook quản lý State & Data fetching
│   └── use<FeaturePageName>.ts
└── components/                        # Sub-components được chia nhỏ theo vùng giao diện
    ├── ComponentA.tsx
    └── ComponentB.tsx
```

### Nguyên tắc 3 tầng (Three-Tier Principle):
1. **`index.ts` (Barrel Export):**
   ```ts
   export { default } from "./<FeaturePageName>";
   ```
   *Giúp rút ngắn đường dẫn import từ các nơi khác và giữ nguyên router config.*

2. **`<FeaturePageName>.tsx` (View Layer):**
   * Chỉ đóng vai trò điều phối bố cục (Grid system, AntD `Row`/`Col`/`Card`, `Spin` loading).
   * Không chứa các logic tính toán nặng, filter phức tạp hay call API trực tiếp.

3. **`hooks/use<FeaturePageName>.ts` (Logic & Data Layer):**
   * Quản lý `useState`, `useEffect`, gọi service API.
   * Xử lý định dạng dữ liệu, tính toán thống kê (min, max, màu sắc match score).
   * Trả về object chứa dữ liệu và các event handlers sạch cho View layer.

4. **`components/` (Component Layer):**
   * Các khối giao diện nhỏ (Bar Chart, Funnel, Filter Bar, Leaderboard Table, Sub-sections).
   * Nhận `props` rõ ràng từ View Layer, giữ cho file gọn gàng (dưới 300 dòng/file).

---

## 3. Quy chuẩn Thiết kế UI (B2B SaaS Standards)

* **Màu nền trang (Page Background):** Slate Light `#F8FAFC`. Tránh dùng nền đen tuyền hoặc nền trắng tinh toàn bộ không có độ tương phản.
* **Surface Containers:** Thẻ `<Card>` màu trắng `#FFFFFF` với hiệu ứng độ sâu glassmorphism nhạt.
* **Borders & Dividers:** Slate `#E2E8F0` mảnh nhẹ.
* **Brand Primary Accent:** Royal Blue `#2563EB` hoặc `#1677FF`.
* **Semantic Colors (Năng lực & Match Score):**
  * Perfect Match (>=80%): Emerald Green `#10B981` (Nền: `#F0FDF4`, Viền: `#BBF7D0`)
  * Good Match (60-79%): Blue `#2563EB`
  * Potential Match (40-59%): Amber `#F59E0B` (Nền: `#FFFBEB`, Viền: `#FDE68A`)
  * Low Match (<40%): Crimson `#EF4444` (Nền: `#FEF2F2`, Viền: `#FECACA`)

---

## 4. Thuật ngữ Chuẩn hóa (Terminology Rule)

Để duy trì tính chuyên nghiệp và đặc trưng cho sản phẩm SaaS Tuyển dụng AI:
* **Năng lực & Cảnh báo:** Sử dụng thay cho "Đối sánh Kỹ năng".
* **Ngôn từ & Chân thực:** Sử dụng thay cho "Kiểm soát Định kiến".
* **Gợi ý phỏng vấn:** Sử dụng thay cho "Chiến lược Phỏng vấn".
