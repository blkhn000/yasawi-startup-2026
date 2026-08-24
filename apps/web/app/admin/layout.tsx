import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YASAWI CONTROL",
  description: "YASAWI STARTUP content management",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
