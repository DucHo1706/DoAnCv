import { Space, Typography } from "antd";
import type { ReactNode } from "react";
import { appTheme } from "../../constants/theme";

const { Title, Paragraph } = Typography;

type PageContainerProps = {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
};

function PageContainer({ title, subtitle, extra, children }: PageContainerProps) {
  return (
    <div>
      <div
        style={{
          marginBottom: 28,
          paddingBottom: 20,
          borderBottom: `1px solid ${appTheme.colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Space direction="vertical" size={4}>
          <Title level={2} style={{ margin: 0, color: appTheme.colors.textPrimary, fontWeight: 800 }}>
            {title}
          </Title>
          {subtitle ? (
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 14 }}>
              {subtitle}
            </Paragraph>
          ) : null}
        </Space>

        {extra ? <div>{extra}</div> : null}
      </div>

      {children}
    </div>
  );
}

export default PageContainer;
