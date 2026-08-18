import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function logAudit({
  actorId,
  actorName,
  action,
  entityType,
  entityLabel,
  details,
}: {
  actorId: string;
  actorName: string;
  action: "crear" | "editar" | "eliminar";
  entityType: string;
  entityLabel?: string;
  details?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId,
    actor_name: actorName,
    action,
    entity_type: entityType,
    entity_label: entityLabel ?? null,
    details: details ?? null,
  });

  // No crítico: la acción principal ya se completó antes de llegar aquí, así
  // que un fallo al auditar no debería revertir/romper esa acción — pero sí
  // se registra para poder detectarlo.
  if (error) console.error("logAudit:", error.message);
}
