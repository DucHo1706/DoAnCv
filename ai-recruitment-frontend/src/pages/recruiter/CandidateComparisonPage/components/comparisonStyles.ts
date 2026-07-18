import { appTheme } from "../../../../constants/theme";

export const comparisonCardStyle = {
  height: "100%",
  background: appTheme.colors.surface,
  border: `1px solid ${appTheme.colors.border}`,
  borderRadius: appTheme.radius.lg,
  boxShadow: appTheme.shadow.card,
};

export const comparisonScrollStyle = {
  overflowX: "auto" as const,
  paddingBottom: appTheme.spacing.sm,
};
