"use client";

import { useState, useTransition } from "react";
import { Siren } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmergencyButton({
  action,
}: {
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();

      await new Promise<void>((resolve) => {
        if (!navigator.geolocation) {
          resolve();
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            formData.set("lat", String(pos.coords.latitude));
            formData.set("lng", String(pos.coords.longitude));
            resolve();
          },
          () => resolve(),
          { timeout: 4000 }
        );
      });

      try {
        const result = await action(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setSent(true);
          setConfirming(false);
        }
      } catch {
        setError("No se pudo enviar la alerta. Intenta de nuevo o llama directamente.");
      }
    });
  }

  if (sent) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
        Alerta enviada a administración.
      </p>
    );
  }

  if (confirming) {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Button
            type="button"
            className="h-11 flex-1 bg-red-600 text-white hover:bg-red-600/90"
            disabled={pending}
            onClick={handleConfirm}
          >
            <Siren /> {pending ? "Enviando..." : "Confirmar emergencia"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setConfirming(false)}
          >
            Cancelar
          </Button>
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      className="h-11 w-full"
      onClick={() => setConfirming(true)}
    >
      <Siren /> Emergencia
    </Button>
  );
}
