import { Card, Skeleton, Space } from "antd";

export default function Loading() {
  return (
    <div className="grid gap-4" aria-live="polite" aria-busy="true">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Space orientation="vertical" size={8}>
            <Skeleton.Input active size="small" style={{ width: 96 }} />
            <Skeleton.Input active size="large" style={{ width: 180 }} />
          </Space>
          <Space wrap>
            <Skeleton.Button active style={{ width: 112 }} />
            <Skeleton.Button active style={{ width: 112 }} />
            <Skeleton.Button active style={{ width: 88 }} />
          </Space>
        </div>
      </Card>

      <Card title={<Skeleton.Input active size="small" style={{ width: 120 }} />}>
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      </Card>

      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </div>
  );
}
