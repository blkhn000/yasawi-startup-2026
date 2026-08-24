import { ImageResponse } from "next/og";

export const alt = "YASAWI STARTUP — business incubator in Turkistan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#15170f", color: "#f3f1e8", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "72px 80px", position: "relative", width: "100%" }}>
      <div style={{ color: "#d9ff5c", display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 8 }}>YASAWI STARTUP</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 900, letterSpacing: -4, lineHeight: 1.05 }}>FROM IDEA<br />TO LAUNCH</div>
        <div style={{ color: "#bfc2b7", display: "flex", fontSize: 28 }}>Business incubator · Turkistan</div>
      </div>
      <div style={{ background: "#9b87ff", borderRadius: 999, bottom: 72, display: "flex", height: 120, position: "absolute", right: 80, width: 120 }} />
    </div>,
    size,
  );
}
