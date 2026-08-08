import { ImageResponse } from "next/og";

export const alt = "常州 AI Club · 让真实问题长成 AI 项目";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 80% 18%, rgba(62, 171, 134, 0.18), transparent 32%), linear-gradient(135deg, #fffdf8 0%, #f2f7f3 100%)",
          color: "#111b1f",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px 88px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            maxWidth: 1024,
            width: "100%",
          }}
        >
          <div
            style={{
              alignItems: "center",
              color: "#08775c",
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              gap: 16,
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                background: "#22a77c",
                borderRadius: 999,
                display: "flex",
                height: 18,
                width: 18,
              }}
            />
            常州本地 AI 实践者社区
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              fontWeight: 900,
              gap: 8,
              letterSpacing: "-0.045em",
              lineHeight: 1.08,
            }}
          >
            <span>常州 AI Club</span>
            <span style={{ color: "#08775c" }}>让真实问题长成 AI 项目</span>
          </div>
          <div
            style={{
              color: "#52615e",
              display: "flex",
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            活动连接 · 成员协作 · 场景验证 · 案例沉淀
          </div>
        </div>
      </div>
    ),
    size,
  );
}
