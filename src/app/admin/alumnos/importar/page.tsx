"use client";

import { useActionState } from "react";
import { FileDown, Upload } from "lucide-react";
import { importStudentsCsv } from "../actions";
import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ImportarAlumnosPage() {
  const [state, formAction, pending] = useActionState(importStudentsCsv, undefined);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/alumnos" label="Volver a alumnos" />
        <h1 className="text-xl font-semibold tracking-tight">Importar alumnos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cargar desde CSV</CardTitle>
          <CardDescription>
            Cada padre/madre debe existir ya en la plataforma (se relaciona por su número de
            documento). Descarga la plantilla, complétala y súbela aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" size="sm" render={<a href="/plantilla-alumnos.csv" download />}>
            <FileDown /> Descargar plantilla
          </Button>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="file">Archivo CSV</Label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
              />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending}>
              <Upload /> {pending ? "Importando..." : "Importar"}
            </Button>
          </form>

          {state?.result && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium text-emerald-600">
                {state.result.success} alumno(s) importado(s) correctamente.
              </p>
              {state.result.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {state.result.errors.length} fila(s) con errores:
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                    {state.result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
