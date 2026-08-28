import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lee sus archivos de fuente (.afm) en tiempo de ejecución vía
  // fs.readFileSync(__dirname + "/data/...") en vez de un require() estático,
  // así que el tracer de Vercel no los detecta solo y hay que incluirlos a
  // mano — si no, cualquier export en PDF responde 500 en producción.
  outputFileTracingIncludes: {
    "/api/export/**": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
