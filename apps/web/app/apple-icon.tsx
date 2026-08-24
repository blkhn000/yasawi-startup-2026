import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#15170f", borderRadius: 36, color: "#d9ff5c", display: "flex", fontSize: 72, fontWeight: 900, height: "100%", justifyContent: "center", width: "100%" }}>YS</div>,
    size,
  );
}
