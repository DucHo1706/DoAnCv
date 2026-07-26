import { Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { appTheme } from "../../constants/theme";

const { Text, Paragraph } = Typography;

type EmptyStateProps = {
  /** Main message, e.g. "Chưa có ứng viên nào ứng tuyển" */
  description?: string;
  /** Optional actionable hint shown below the description, e.g. "Hãy đăng tin tuyển dụng để bắt đầu nhận CV." */
  hint?: string;
  /** Optional icon (Ant Design icon component). Defaults to a neutral inbox glyph. */
  icon?: ReactNode;
  /** Optional action button/link rendered below the hint (e.g. <Button>Đăng tin ngay</Button>). */
  action?: ReactNode;
};

function EmptyState({ description = "Hiện chưa có dữ liệu để hiển thị.", hint, icon, action }: EmptyStateProps) {
  return (
    <div
      className="entry-anim"
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#EFF6FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: appTheme.colors.primary,
          fontSize: 28,
          marginBottom: 16,
        }}
      >
        {icon ?? <InboxOutlined />}
      </div>
      <Text strong style={{ fontSize: 15, color: appTheme.colors.textPrimary }}>
        {description}
      </Text>
      {hint ? (
        <Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0, maxWidth: 360, fontSize: 13.5 }}>
          {hint}
        </Paragraph>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export default EmptyState;
