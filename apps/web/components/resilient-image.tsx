"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type ResilientImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
};

export function ResilientImage({ src, alt, unoptimized, ...props }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return <span className="remote-image-fallback" role="img" aria-label={alt}><b>YS</b><small>YASAWI STARTUP</small></span>;
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? isAyuImage(src)}
      onError={() => setFailed(true)}
    />
  );
}

function isAyuImage(src: string) {
  try {
    const hostname = new URL(src).hostname.toLowerCase();
    return hostname === "ayu.edu.kz" || hostname === "www.ayu.edu.kz";
  } catch {
    return false;
  }
}
