import { Pagination, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface AppPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: string[];
  showSizeChanger?: boolean;
}

export const AppPagination: React.FC<AppPaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions = ["9", "18", "36"],
  showSizeChanger = true,
}) => {
  if (total <= 0) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid rgba(226, 232, 240, 0.8)",
        marginTop: 20,
        boxShadow: "0 2px 10px rgba(148, 163, 184, 0.04)",
      }}
    >
      <Text style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
        Hiển thị <strong style={{ color: "#0F172A" }}>{Math.min((current - 1) * pageSize + 1, total)}</strong> -{" "}
        <strong style={{ color: "#0F172A" }}>{Math.min(current * pageSize, total)}</strong> trong tổng số{" "}
        <strong style={{ color: "#2563EB" }}>{total}</strong> tin tuyển dụng
      </Text>

      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={onChange}
        showSizeChanger={showSizeChanger}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
};

export default AppPagination;
