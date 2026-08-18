import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="110" fill="#4f46e5"/>
  <rect x="96" y="180" width="320" height="160" rx="28" fill="#ffffff"/>
  <rect x="120" y="204" width="272" height="54" rx="10" fill="#4f46e5"/>
  <rect x="252" y="204" width="8" height="54" fill="#ffffff"/>
  <circle cx="170" cy="356" r="34" fill="#4f46e5"/>
  <circle cx="170" cy="356" r="14" fill="#ffffff"/>
  <circle cx="342" cy="356" r="34" fill="#4f46e5"/>
  <circle cx="342" cy="356" r="14" fill="#ffffff"/>
</svg>
`;

const outDir = path.join(__dirname, "..", "public", "icons");

const targets = [
  { file: "icon-512.png", size: 512 },
  { file: "icon-192.png", size: 192 },
  { file: "apple-icon-180.png", size: 180 },
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-16.png", size: 16 },
];

for (const { file, size } of targets) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, file));
  console.log(`Generated ${file}`);
}
