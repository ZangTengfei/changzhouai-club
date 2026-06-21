import { Card, Skeleton, Space } from "antd";

export default function Loading() {
  return (
    <div className="grid gap-4" aria-live="polite" aria-busy="true">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Skeleton active paragraph={{ rows: 1, width: ["45%"] }} title={{ width: "24%" }} />
          <Space wrap className="sm:justify-end">
            <Skeleton active paragraph={false} title={{ width: 112 }} />
            <Skeleton active paragraph={false} title={{ width: 112 }} />
            <Skeleton active paragraph={false} title={{ width: 88 }} />
          </Space>
        </div>
      </Card>

      <Card title="加载中">
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      </Card>

      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </div>
  );
}
