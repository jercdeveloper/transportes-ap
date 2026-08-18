"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

export function ActionMessageButton({
  action,
  icon,
  label,
  pendingLabel,
}: {
  action: (
    state: { message: string } | undefined,
    formData: FormData
  ) => Promise<{ message: string } | undefined>;
  icon: React.ReactNode;
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {icon}
        {pending ? pendingLabel : label}
      </Button>
      {state?.message && (
        <p className="text-xs text-muted-foreground">{state.message}</p>
      )}
    </form>
  );
}
