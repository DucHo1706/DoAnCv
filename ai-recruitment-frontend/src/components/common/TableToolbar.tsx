import { Input, Space } from "antd";
import type { ReactNode } from "react";

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
        style={{ width: 320 }}
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
        onSearch={onSearch}
      />

      {toolbarExtra && <Space wrap>{toolbarExtra}</Space>}
    </div>
  );
}

export default TableToolbar;
