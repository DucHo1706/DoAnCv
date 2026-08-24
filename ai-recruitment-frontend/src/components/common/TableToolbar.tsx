import { Input } from "antd";
import type { ReactNode } from "react";
import { useResponsive } from "../../hooks/useResponsive";

type TableToolbarProps = {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearch?: (val: string) => void;
  extra?: ReactNode;
  action?: ReactNode;
  actions?: ReactNode;
};

function TableToolbar({
  searchPlaceholder = "Tìm kiếm...",
  searchValue,
  onSearchChange,
  onSearch,
  extra,
  action,
  actions,
}: TableToolbarProps) {
  const { isMobile } = useResponsive();
  const toolbarExtra = extra ?? action ?? actions;
  return (
    <div
      style={{
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Input.Search
        placeholder={searchPlaceholder}
        allowClear
        style={{ width: isMobile ? "100%" : 320, maxWidth: "100%", minWidth: 0, flexShrink: 0 }}
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
        onSearch={onSearch}
      />

      {toolbarExtra && (
        <div
          style={{
            flex: "1 1 520px",
            width: isMobile ? "100%" : "auto",
            minWidth: 0,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: isMobile ? "stretch" : "flex-end",
            gap: 10,
          }}
        >
          {toolbarExtra}
        </div>
      )}
    </div>
  );
}

export default TableToolbar;
