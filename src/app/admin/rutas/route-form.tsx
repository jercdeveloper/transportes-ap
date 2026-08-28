"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

export type RouteFormValues = {
  name?: string;
  driver_id?: string | null;
  vehicle_plate?: string | null;
  vehicle_model?: string | null;
  vehicle_capacity?: number | null;
  soat_expiry?: string | null;
  tech_inspection_expiry?: string | null;
};

export function RouteForm({
  action,
  choferes,
  submitLabel,
  initialValues,
}: {
  action: (
    state: { error: string } | undefined,
    formData: FormData
  ) => Promise<{ error: string } | undefined>;
  choferes: { id: string; full_name: string }[];
  submitLabel: string;
  initialValues?: RouteFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <Card>
      <CardContent>
        <form
          key={JSON.stringify(initialValues)}
          action={formAction}
          className="grid gap-4 sm:grid-cols-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre de la ruta</Label>
            <Input id="name" name="name" required defaultValue={initialValues?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="driver_id">Chofer (opcional)</Label>
            <NativeSelect
              id="driver_id"
              name="driver_id"
              defaultValue={initialValues?.driver_id ?? ""}
            >
              <option value="">Sin asignar</option>
              {choferes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <Field
            label="Placa del vehículo"
            name="vehicle_plate"
            defaultValue={initialValues?.vehicle_plate ?? undefined}
          />
          <Field
            label="Modelo del vehículo"
            name="vehicle_model"
            defaultValue={initialValues?.vehicle_model ?? undefined}
          />
          <Field
            label="Capacidad (pasajeros)"
            name="vehicle_capacity"
            type="number"
            defaultValue={initialValues?.vehicle_capacity?.toString()}
          />
          <Field
            label="Vencimiento SOAT"
            name="soat_expiry"
            type="date"
            defaultValue={initialValues?.soat_expiry ?? undefined}
          />
          <Field
            label="Vencimiento tecnomecánica"
            name="tech_inspection_expiry"
            type="date"
            defaultValue={initialValues?.tech_inspection_expiry ?? undefined}
          />

          {state?.error && (
            <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>
          )}

          <div className="sm:col-span-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
    </div>
  );
}
