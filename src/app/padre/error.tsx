"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PadreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" />
        </div>
        <div>
          <p className="font-semibold">Algo salió mal</p>
          <p className="text-sm text-muted-foreground">
            No se pudo completar la acción. Intenta de nuevo.
          </p>
        </div>
        <Button onClick={reset}>Reintentar</Button>
      </CardContent>
    </Card>
  );
}
