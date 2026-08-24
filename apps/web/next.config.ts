import type { NextConfig } from "next";

const s3PublicUrl = process.env.S3_PUBLIC_URL;
const s3RemotePattern = (() => {
  if (!s3PublicUrl) return [];
  try {
    const url = new URL(s3PublicUrl);
    return [{ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, port: url.port, pathname: "/**" }];
  } catch { return []; }
})();
const externalImageOrigins = ["https://ayu.edu.kz", "https://www.ayu.edu.kz", ...(s3PublicUrl ? [safeOrigin(s3PublicUrl)].filter(Boolean) : [])].join(" ");
const publicApiOrigin = safeOrigin(process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "ayu.edu.kz", pathname: "/**" },
      { protocol: "https", hostname: "www.ayu.edu.kz", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
      ...s3RemotePattern,
    ],
  },
  // Dev и production не должны перезаписывать CSS-чанки друг друга.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async rewrites() {
    const apiOrigin = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    const development = process.env.NODE_ENV !== "production";
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${externalImageOrigins}`,
      `connect-src 'self'${publicApiOrigin ? ` ${publicApiOrigin}` : ""}${development ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(development ? [] : ["upgrade-insecure-requests"]),
    ].join("; ");
    return [
    {
      source: "/admin/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
    },
    {
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(development ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
      ],
    }];
  },
};

export default nextConfig;

function safeOrigin(value: string | undefined) {
  if (!value || value.startsWith("/")) return "";
  try { return new URL(value).origin; } catch { return ""; }
}
