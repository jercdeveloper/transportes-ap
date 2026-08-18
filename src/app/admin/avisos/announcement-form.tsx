"use client";

import { useActionState } from "react";
import { createAnnouncement } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

export function AnnouncementForm({ routes }: { routes: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createAnnouncement, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Mensaje</Label>
        <Textarea id="body" name="body" rows={3} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="route_id">Destinatarios</Label>
        <NativeSelect id="route_id" name="route_id" defaultValue="">
          <option value="">Todos los padres</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              Solo padres de la ruta &quot;{r.name}&quot;
            </option>
          ))}
        </NativeSelect>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar aviso"}
      </Button>
    </form>
  );
}
