import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YASAWI STARTUP",
    short_name: "YASAWI",
    description: "Akhmet Yassawi University business incubator",
    start_url: "/ru",
    display: "standalone",
    background_color: "#f3f1e8",
    theme_color: "#15170f",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
