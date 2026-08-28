"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function IncidentForm({
  action,
  students,
}: {
  action: (formData: FormData) => void;
  students: { student_id: string; students: { full_name: string | null } | null }[];
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
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

    const { error } = await supabase.storage
      .from("incident-photos")
      .upload(path, file);

    if (error) {
      setUploadStatus("error");
      return;
    }

    const { data } = supabase.storage.from("incident-photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploadStatus("done");
  }

  return (
    <form action={action} className="space-y-3">
      <NativeSelect name="student_id">
        <option value="">General (no es de un alumno en particular)</option>
        {students.map((a) => (
          <option key={a.student_id} value={a.student_id}>
            {a.students?.full_name}
          </option>
        ))}
      </NativeSelect>
      <Textarea
        name="description"
        required
        placeholder="Describe lo ocurrido..."
        rows={3}
      />

      <div className="space-y-1.5">
        <Label htmlFor="photo" className="flex items-center gap-1.5">
          <Camera className="size-3.5" />
          Foto (opcional)
        </Label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
        />
        {uploadStatus === "uploading" && (
          <p className="text-xs text-muted-foreground">Subiendo foto...</p>
        )}
        {uploadStatus === "done" && (
          <p className="text-xs text-emerald-600">Foto lista ✓</p>
        )}
        {uploadStatus === "error" && (
          <p className="text-xs text-destructive">No se pudo subir la foto.</p>
        )}
      </div>

      <input type="hidden" name="photo_url" value={photoUrl ?? ""} />

      <Button type="submit" disabled={uploadStatus === "uploading"}>
        Enviar reporte
      </Button>
    </form>
  );
}
