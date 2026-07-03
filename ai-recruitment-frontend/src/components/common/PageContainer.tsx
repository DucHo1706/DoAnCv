import { Space, Typography } from "antd";
import type { ReactNode } from "react";

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
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Space direction="vertical" size={4}>
          <Title level={2} style={{ margin: 0 }}>
            {title}
          </Title>
          {subtitle ? (
            <Paragraph type="secondary" style={{ margin: 0 }}>
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
