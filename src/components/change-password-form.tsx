"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">
          No se pudo actualizar la contraseña. Intenta de nuevo.
        </p>
      )}

      <Button type="submit" disabled={status === "saving"} size="lg" className="w-full">
        {status === "saving" ? "Guardando..." : "Actualizar contraseña"}
      </Button>
    </form>
  );
}
