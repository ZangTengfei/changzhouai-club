"use client";

import type { ReactNode } from "react";
import { App, ConfigProvider, theme } from "antd";

export function AdminAntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#0f8f7e",
          colorSuccess: "#16a36a",
          colorWarning: "#f59f00",
          colorError: "#ef4444",
          colorInfo: "#2563eb",
          colorText: "#111827",
          colorTextSecondary: "#5f6b7a",
          colorBgBase: "#ffffff",
          colorBgLayout: "#f7f9fb",
          colorBorder: "#e5e7eb",
          borderRadius: 8,
          borderRadiusLG: 10,
          borderRadiusSM: 6,
          fontFamily:
            '"Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
          boxShadowTertiary: "0 10px 28px rgba(15, 23, 42, 0.06)",
        },
        components: {
          Layout: {
            bodyBg: "#f7f9fb",
            siderBg: "#ffffff",
            headerBg: "#ffffff",
            triggerBg: "#0f8f7e",
          },
          Menu: {
            itemBorderRadius: 8,
            itemHeight: 42,
            itemSelectedBg: "#e8f7f4",
            itemSelectedColor: "#087768",
          },
          Card: {
            borderRadiusLG: 10,
            headerBg: "#ffffff",
            paddingLG: 20,
          },
          Table: {
            headerBg: "#fafafa",
            headerColor: "#5f6b7a",
            rowHoverBg: "#f3fbf9",
          },
          Button: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Tag: {
            borderRadiusSM: 6,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
