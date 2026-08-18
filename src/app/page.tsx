import Link from "next/link";
import { Bus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary/5 via-background to-background px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <Bus className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Transportes AP</h1>
        <p className="max-w-sm text-muted-foreground">
          Plataforma de gestión de rutas, seguridad y cobros para transporte
          escolar.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button render={<Link href="/login" />} size="lg">
          Iniciar sesión
        </Button>
        <Button render={<Link href="/inscripcion" />} size="lg" variant="outline">
          Solicitar el servicio
        </Button>
      </div>
    </main>
  );
}
