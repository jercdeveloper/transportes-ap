"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/actualizar-password`,
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te enviaremos un enlace a tu correo para crear una nueva."
    >
      {status === "sent" ? (
        <p className="text-sm text-emerald-600">
          Listo, revisa tu correo (y la carpeta de spam) para el enlace.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-destructive">
              No se pudo enviar el correo. Intenta de nuevo.
            </p>
          )}

          <Button type="submit" disabled={status === "sending"} className="w-full">
            {status === "sending" ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:text-foreground hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
