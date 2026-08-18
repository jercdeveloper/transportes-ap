"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { name: "checklist_tires", label: "Llantas en buen estado" },
  { name: "checklist_brakes", label: "Frenos funcionando bien" },
  { name: "checklist_lights", label: "Luces funcionando" },
  { name: "checklist_seatbelts", label: "Cinturones de seguridad disponibles" },
] as const;

export function StartTripForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = ITEMS.every((item) => checked[item.name]);

  return (
    <form action={action} className="space-y-2 rounded-lg border border-border p-3">
      <p className="text-sm font-medium">Checklist antes de salir</p>
      {ITEMS.map((item) => (
        <label key={item.name} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={item.name}
            checked={checked[item.name] ?? false}
            onChange={(e) =>
              setChecked((c) => ({ ...c, [item.name]: e.target.checked }))
            }
            className="size-4 accent-primary"
          />
          {item.label}
        </label>
      ))}
      <Button type="submit" size="lg" className="w-full" disabled={!allChecked}>
        <Play /> Iniciar viaje
      </Button>
    </form>
  );
}
