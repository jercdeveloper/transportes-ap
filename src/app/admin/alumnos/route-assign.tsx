"use client";

import { useActionState } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RouteAssign({
  action,
  routes,
  currentRouteId,
  currentStopOrder,
}: {
  action: (
    state: { error: string } | undefined,
    formData: FormData
  ) => Promise<{ error: string } | undefined>;
  routes: { id: string; name: string }[];
  currentRouteId: string | null;
  currentStopOrder: number | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2 border-t border-border pt-3"
    >
      <NativeSelect
        key={currentRouteId ?? "none"}
        name="route_id"
        defaultValue={currentRouteId ?? ""}
        className="max-w-48"
      >
        <option value="">Sin ruta</option>
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </NativeSelect>

      <Input
        key={currentStopOrder ?? "default"}
        name="stop_order"
        type="number"
        min="1"
        defaultValue={currentStopOrder ?? 1}
        title="Orden de recogida en la ruta"
        className="w-16"
      />

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>

      {state?.error && (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}
