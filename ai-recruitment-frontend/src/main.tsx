import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import App from "./App";
import { appTheme } from "./constants/theme";
import "antd/dist/reset.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: appTheme.colors.primary,
          colorLink: appTheme.colors.primary,
          colorSuccess: appTheme.colors.success,
          colorWarning: appTheme.colors.warning,
          colorError: appTheme.colors.error,
          colorInfo: appTheme.colors.info,

          colorBgLayout: appTheme.colors.background,
          colorBgContainer: appTheme.colors.surface,
          colorBorder: appTheme.colors.border,

          colorText: appTheme.colors.textPrimary,
          colorTextSecondary: appTheme.colors.textSecondary,

          borderRadius: appTheme.radius.md,
          fontFamily: appTheme.font.family,
          fontSize: appTheme.font.size,

          boxShadow: appTheme.shadow.card,
        },
        components: {
          Layout: {
            headerBg: appTheme.colors.surface,
            siderBg: "#0F172A",
            bodyBg: appTheme.colors.background,
          },
          Menu: {
            darkItemBg: "#0F172A",
            darkItemSelectedBg: appTheme.colors.primary,
            darkItemHoverBg: "#1E293B",
            darkItemColor: "#CBD5E1",
            darkItemSelectedColor: "#FFFFFF",
          },
          Card: {
            borderRadiusLG: appTheme.radius.lg,
          },
          Button: {
            borderRadius: appTheme.radius.md,
            controlHeight: 40,
            fontWeight: appTheme.font.weightSemibold,
          },
          Input: {
            borderRadius: appTheme.radius.md,
            controlHeight: 40,
          },
          Select: {
            borderRadius: appTheme.radius.md,
            controlHeight: 40,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);