import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de alumnos e incidencias, servidas desde Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
