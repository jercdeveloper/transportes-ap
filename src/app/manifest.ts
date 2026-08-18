import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Transportes AP",
    short_name: "Transportes AP",
    description: "Rutas en vivo, recogida/entrega y pagos del transporte escolar.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4338ca",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
