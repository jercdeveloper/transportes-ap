"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type PersonFormState = { error: string } | undefined;

export type PersonFormValues = {
  full_name?: string;
  document_id?: string | null;
  phone?: string | null;
  phone_alt?: string | null;
  license_number?: string | null;
  license_category?: string | null;
  license_expiry?: string | null;
};

export function PersonForm({
  action,
  submitLabel,
  variant = "padre",
  mode = "create",
  initialValues,
}: {
  action: (
    state: PersonFormState,
    formData: FormData
  ) => Promise<PersonFormState>;
  submitLabel: string;
  variant?: "padre" | "chofer";
  mode?: "create" | "edit";
  initialValues?: PersonFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <Card>
      <CardContent>
        <form
          key={JSON.stringify(initialValues)}
          action={formAction}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field
            label="Nombre completo"
            name="full_name"
            required
            defaultValue={initialValues?.full_name}
          />
          <Field
            label="Documento de identidad"
            name="document_id"
            defaultValue={initialValues?.document_id}
          />
          <Field
            label="Teléfono"
            name="phone"
            defaultValue={initialValues?.phone}
          />
          <Field
            label={variant === "padre" ? "Teléfono alterno / WhatsApp" : "Teléfono alterno"}
            name="phone_alt"
            defaultValue={initialValues?.phone_alt}
          />

          {mode === "create" && (
            <>
              <Field label="Correo" name="email" type="email" required />
              <Field
                label="Contraseña temporal"
                name="password"
                type="password"
                required
              />
            </>
          )}

          {variant === "chofer" && (
            <>
              <Field
                label="Número de licencia"
                name="license_number"
                defaultValue={initialValues?.license_number}
              />
              <Field
                label="Categoría de licencia"
                name="license_category"
                placeholder="Ej: C2"
                defaultValue={initialValues?.license_category}
              />
              <Field
                label="Vencimiento de licencia"
                name="license_expiry"
                type="date"
                defaultValue={initialValues?.license_expiry}
              />
            </>
          )}

          {state?.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}

          <div className="sm:col-span-2">
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
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
      />
    </div>
  );
}
