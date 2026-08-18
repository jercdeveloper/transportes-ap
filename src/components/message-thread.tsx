"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function MessageThread({
  messages,
  currentUserId,
  sendAction,
}: {
  messages: { id: string; sender_id: string; body: string; created_at: string }[];
  currentUserId: string;
  sendAction: (
    state: { error: string } | undefined,
    formData: FormData
  ) => Promise<{ error: string } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(sendAction, undefined);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {messages.length ? (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p>{m.body}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    mine ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(m.created_at).toLocaleString("es-CO")}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay mensajes. Escribe el primero.
          </p>
        )}
      </div>

      <form action={formAction} className="space-y-1.5">
        <div className="flex items-end gap-2">
          <Textarea
            name="body"
            placeholder="Escribe un mensaje..."
            rows={2}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </div>
  );
}
