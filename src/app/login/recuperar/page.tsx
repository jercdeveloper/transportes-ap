"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
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
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {status === "error" && (
            <p className="text-sm text-destructive">
              No se pudo enviar el correo. Intenta de nuevo.
            </p>
          )}

          <Button
            type="submit"
            disabled={status === "sending"}
            size="lg"
            className="w-full"
          >
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
