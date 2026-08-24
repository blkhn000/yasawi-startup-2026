import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Yasawi Startup — home">
      <Image src="/brand/yasawi-startup-logo.png" alt="Yasawi Startup" width={120} height={56} priority />
    </Link>
  );
}
