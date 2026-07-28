"use client";

import type { ReactNode } from "react";
import { App, ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";

export function AdminAntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          colorBgLayout: "#f5f5f5",
          colorBgContainer: "#ffffff",
          colorBorder: "#e5e7eb",
          colorText: "#1f2937",
          colorTextSecondary: "#6b7280",
          borderRadius: 6,
          borderRadiusLG: 8,
          boxShadowTertiary: "0 1px 3px rgba(0, 0, 0, 0.06)",
          fontFamily:
            '"SF Pro Text", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Button: { controlHeight: 36, borderRadius: 6 },
          Card: { borderRadiusLG: 8, headerBg: "#ffffff" },
          Menu: { itemBorderRadius: 6, itemHeight: 42 },
          Table: { headerBg: "#fafafa", headerColor: "#374151" },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
