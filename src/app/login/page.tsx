"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "./actions";
import { AuthShell } from "@/components/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <AuthShell title="Transportes AP" description="Inicia sesión para continuar">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required />
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login/recuperar" className="hover:text-foreground hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/inscripcion" className="text-primary hover:underline">
            Solicita el servicio
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
