import { Empty } from "antd";

interface EmptyChartProps {
  description: string;
  height?: number;
}

export default function EmptyChart(props: EmptyChartProps) {
  const chartHeight = props.height || 260;

  return (
    <div
      style={{
        height: chartHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={props.description} />
    </div>
  );
}
