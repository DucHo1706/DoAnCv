import React from "react";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  MinusCircleFilled,
  CheckOutlined,
  WarningOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

/** Icon đại diện cho trạng thái Đang chạy / Đang tuyển */
export const StatusRunningIcon: React.FC<IconProps> = ({ size = 14, color = "#10B981", style }) => (
  <CheckCircleFilled style={{ fontSize: size, color, marginRight: 6, ...style }} />
);

/** Icon đại diện cho trạng thái Chờ duyệt */
export const StatusPendingIcon: React.FC<IconProps> = ({ size = 14, color = "#F97316", style }) => (
  <ClockCircleFilled style={{ fontSize: size, color, marginRight: 6, ...style }} />
);

/** Icon đại diện cho trạng thái Đã đóng / Tạm ẩn */
export const StatusClosedIcon: React.FC<IconProps> = ({ size = 14, color = "#94A3B8", style }) => (
  <MinusCircleFilled style={{ fontSize: size, color, marginRight: 6, ...style }} />
);

/** Icon đáp ứng kỹ năng */
export const SkillMatchedIcon: React.FC<IconProps> = ({ size = 14, color = "#10B981", style }) => (
  <CheckOutlined style={{ fontSize: size, color, marginRight: 6, fontWeight: 700, ...style }} />
);

/** Icon thiếu kỹ năng */
export const SkillMissingIcon: React.FC<IconProps> = ({ size = 14, color = "#F59E0B", style }) => (
  <WarningOutlined style={{ fontSize: size, color, marginRight: 6, ...style }} />
);

/** Icon AI Sparkles cho hệ thống B2B SaaS */
export const AiEngineIcon: React.FC<IconProps> = ({ size = 16, color = "#2563EB", style }) => (
  <ThunderboltFilled style={{ fontSize: size, color, marginRight: 6, ...style }} />
);
