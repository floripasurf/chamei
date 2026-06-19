import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/meu-perfil"],
    },
    sitemap: "https://chamei.app/sitemap.xml",
    host: "https://chamei.app",
  };
}
