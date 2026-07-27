import React from "react";
import { Card, Table } from "antd";

interface JobTableViewProps {
  loading: boolean;
  tableData: any[];
  columns: any[];
  selectedRowKeys: React.Key[];
  onSelectedRowKeysChange: (keys: React.Key[]) => void;
}

export function JobTableView({
  loading,
  tableData,
  columns,
  selectedRowKeys,
  onSelectedRowKeysChange,
}: JobTableViewProps) {
  return (
    <Card
      bodyStyle={{ padding: 0 }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(226, 232, 240, 0.8)",
      }}
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={tableData}
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ["8", "16", "32"] }}
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectedRowKeysChange,
          getCheckboxProps: (record: any) => ({
            disabled: record.raw.status !== "Pending",
          }),
        }}
      />
    </Card>
  );
}
