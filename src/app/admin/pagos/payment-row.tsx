"use client";

import { useActionState } from "react";
import { Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

export function PaymentRow({
  action,
  paymentId,
  amount,
  lateFee,
  status,
}: {
  action: (
    state: { error: string } | undefined,
    formData: FormData
  ) => Promise<{ error: string } | undefined>;
  paymentId?: string;
  amount: number;
  lateFee: number;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <Input
          key={`amount-${amount}`}
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={amount}
          className="w-24"
          aria-label="Monto"
        />
        <Input
          key={`late-fee-${lateFee}`}
          name="late_fee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={lateFee}
          className="w-20"
          title="Recargo por mora"
          aria-label="Recargo por mora"
        />
        <NativeSelect key={`status-${status}`} name="status" defaultValue={status} className="w-32">
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
        </NativeSelect>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        {status === "pagado" && paymentId && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            render={<a href={`/api/export/recibo/${paymentId}`} target="_blank" />}
            title="Descargar recibo"
          >
            <Receipt />
            <span className="sr-only">Descargar recibo</span>
          </Button>
        )}
      </form>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
