"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const CMS_UPDATED_KEY = "yasawi-cms-updated";

export function CmsLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key === CMS_UPDATED_KEY) router.refresh();
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [router]);

  return null;
}
