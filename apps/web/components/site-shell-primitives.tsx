import { Sparkles } from "lucide-react";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow"><Sparkles size={14} />{children}</div>;
}

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`.trim()}>{children}</div>;
}
