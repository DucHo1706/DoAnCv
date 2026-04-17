import { Input, Space } from "antd";
import type { ReactNode } from "react";

type TableToolbarProps = {
  searchPlaceholder?: string;
  extra?: ReactNode;
};

function TableToolbar({
  searchPlaceholder = "Tìm kiếm...",
  extra,
}: TableToolbarProps) {
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
      />

      <Space wrap>{extra}</Space>
    </div>
  );
}

export default TableToolbar;