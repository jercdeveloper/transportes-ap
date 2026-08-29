"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Bus, Mail, Lock } from "lucide-react";
import { login } from "./actions";
import { LoginHeroPanel } from "@/components/login-hero-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <LoginHeroPanel />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Bus className="size-5.5" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Transportes AP
            </span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inicia sesión para continuar
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-8"
                />
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" disabled={pending} size="lg" className="w-full">
              {pending ? "Entrando..." : "Entrar"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/login/recuperar"
                className="hover:text-foreground hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              ¿Aún no tienes cuenta?{" "}
              <Link
                href="/inscripcion"
                className="font-medium text-primary hover:underline"
              >
                Solicita el servicio
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
