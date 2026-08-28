// Las fotos de alumnos e incidencias se suben directo desde la cámara del
// celular (varios MB cada una) sin ningún tipo de compresión — en la vista
// del chofer, que puede mostrar varias a la vez en una conexión móvil, eso
// se nota. Se reduce a un tamaño razonable en el navegador antes de subir,
// así el archivo que realmente viaja por la red siempre es pequeño.
export async function compressImage(
  file: File,
  { maxDimension = 1280, quality = 0.8 }: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    // Si algo falla (formato raro, navegador viejo), se sube el original.
    return file;
  }
}
