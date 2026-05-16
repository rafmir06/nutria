import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: "linear-gradient(135deg, #1a1a1a, #111)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 18,
          height: 18,
          borderRadius: "50% 50% 50% 0",
          background: "linear-gradient(135deg, #30D158, #0A84FF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: -0.5,
          }}
        >
          N
        </div>
      </div>
    </div>,
    { ...size }
  );
}
