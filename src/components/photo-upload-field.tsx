"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { Label } from "@/components/ui/label";

export function PhotoUploadField({
  bucket,
  name,
  label = "Foto",
  defaultUrl,
}: {
  bucket: string;
  name: string;
  label?: string;
  defaultUrl?: string | null;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultUrl ?? null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploadStatus("uploading");
    const file = await compressImage(rawFile);
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file);

    if (error) {
      setUploadStatus("error");
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploadStatus("done");
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${name}-input`} className="flex items-center gap-1.5">
        <Camera className="size-3.5" />
        {label}
      </Label>
      {photoUrl && (
        <Image
          src={photoUrl}
          alt=""
          width={64}
          height={64}
          className="size-16 rounded-lg object-cover ring-1 ring-border"
        />
      )}
      <input
        id={`${name}-input`}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
      />
      {uploadStatus === "uploading" && (
        <p className="text-xs text-muted-foreground">Subiendo foto...</p>
      )}
      {uploadStatus === "error" && (
        <p className="text-xs text-destructive">No se pudo subir la foto.</p>
      )}
      <input type="hidden" name={name} value={photoUrl ?? ""} />
    </div>
  );
}
