"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function SendExpiryAlertsButton({
  action,
}: {
  action: () => Promise<{ message: string }>;
}) {
  const [state, formAction, pending] = useActionState(async () => action(), undefined);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <RefreshCw className={pending ? "animate-spin" : ""} />
        {pending ? "Revisando..." : "Revisar vencimientos"}
      </Button>
      {state?.message && (
        <p className="text-xs text-muted-foreground">{state.message}</p>
      )}
    </form>
  );
}
