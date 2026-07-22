export const appTheme = {
  colors: {
    // 30% - Màu Thương Hiệu (Primary Brand Color)
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    primaryActive: "#1E40AF",

    // 60% - Màu Nền Trung Tính (Neutral Background & Surface)
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E2E8F0",

    textPrimary: "#0F172A",
    textSecondary: "#64748B",

    // 10% - Màu Nhấn (Accent & Highlights)
    accent: "#F97316", // Amber Orange làm màu nhấn chính (CTA đặc biệt, AI Highlight, Match Score)
    success: "#10B981", // Emerald Green (Phù hợp cao / Đã duyệt)
    warning: "#F59E0B", // Amber Yellow (Cần chú ý)
    error: "#EF4444",   // Crimson Red (Cảnh báo / Red Flag)
    info: "#0EA5E9",    // Sky Blue
  },

  font: {
    family: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    size: 15,
    sizeSm: 13,
    sizeLg: 17,
    sizeXl: 22,
    weightNormal: 400,
    weightMedium: 500,
    weightSemibold: 600,
    weightBold: 700,
  },

  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },

  shadow: {
    card: "0 1px 2px rgba(15, 23, 42, 0.06)",
    dropdown: "0 8px 24px rgba(15, 23, 42, 0.12)",
    panel: "0 8px 24px rgba(15, 23, 42, 0.08)",
  },

  layout: {
    siderWidth: 240,
    headerHeight: 64,
    contentMaxWidth: 1600,
  },
};
