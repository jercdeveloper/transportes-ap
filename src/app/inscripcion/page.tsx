"use client";

import { useActionState, useState } from "react";
import { Bus, CircleCheck } from "lucide-react";
import { submitEnrollmentRequest } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function InscripcionPage() {
  const [state, formAction, pending] = useActionState(submitEnrollmentRequest, undefined);
  // Marca de tiempo de cuándo se renderizó el formulario: si llega una
  // solicitud completada en menos de unos segundos, casi seguro es un bot.
  const [renderedAt] = useState(() => Date.now());

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bus className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Solicita el servicio de transporte</h1>
            <p className="text-sm text-muted-foreground">
              Completa el formulario y nos pondremos en contacto contigo.
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            {state?.success ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CircleCheck className="size-10 text-emerald-600" />
                <p className="font-medium">¡Solicitud enviada!</p>
                <p className="text-sm text-muted-foreground">
                  Nos pondremos en contacto contigo pronto para confirmar los detalles.
                </p>
              </div>
            ) : (
              <form action={formAction} className="space-y-4">
                {/* Campo trampa para bots: invisible y sin tabulación para
                    una persona real, pero los bots suelen rellenar todo. */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute h-0 w-0 opacity-0"
                  style={{ left: "-9999px" }}
                />
                <input type="hidden" name="rendered_at" value={renderedAt} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="parent_name">Tu nombre</Label>
                    <Input id="parent_name" name="parent_name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parent_phone">Tu teléfono</Label>
                    <Input id="parent_phone" name="parent_phone" type="tel" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="parent_email">Correo (opcional)</Label>
                  <Input id="parent_email" name="parent_email" type="email" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="student_name">Nombre del alumno</Label>
                    <Input id="student_name" name="student_name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="grade">Grado</Label>
                    <Input id="grade" name="grade" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="school_name">Colegio</Label>
                  <Input id="school_name" name="school_name" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address_label">Dirección de recogida</Label>
                  <Input id="address_label" name="address_label" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Comentarios adicionales</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>

                {state?.error && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}

                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
