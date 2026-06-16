import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "cfo for creators",
    short_name: "cfo for creators",
    description:
      "free financial tools for creators. tax estimator, s-corp calculator, sponsor rate finder, brand contract scanner.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
