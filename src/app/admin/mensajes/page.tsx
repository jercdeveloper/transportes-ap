import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export default async function MensajesPage() {
  const supabase = await createClient();

  const [{ data: padres }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "padre"),
    supabase
      .from("messages")
      .select("parent_id, sender_id, body, read_at, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const lastByParent = new Map<string, { body: string; created_at: string }>();
  const unreadByParent = new Map<string, number>();

  for (const m of messages ?? []) {
    if (!lastByParent.has(m.parent_id)) {
      lastByParent.set(m.parent_id, { body: m.body, created_at: m.created_at });
    }
    if (m.sender_id === m.parent_id && !m.read_at) {
      unreadByParent.set(m.parent_id, (unreadByParent.get(m.parent_id) ?? 0) + 1);
    }
  }

  const sorted = [...(padres ?? [])].sort((a, b) => {
    const aLast = lastByParent.get(a.id)?.created_at;
    const bLast = lastByParent.get(b.id)?.created_at;
    if (aLast && bLast) return new Date(bLast).getTime() - new Date(aLast).getTime();
    if (aLast) return -1;
    if (bLast) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mensajes</h1>
        <p className="text-sm text-muted-foreground">
          Conversaciones con los padres de familia.
        </p>
      </div>

      <div className="space-y-2">
        {sorted.length ? (
          sorted.map((p) => {
            const last = lastByParent.get(p.id);
            const unread = unreadByParent.get(p.id) ?? 0;
            return (
              <Link key={p.id} href={`/admin/mensajes/${p.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{p.full_name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {last?.body ?? "Sin mensajes todavía"}
                      </p>
                    </div>
                    {unread > 0 && <StatusBadge tone="info">{unread}</StatusBadge>}
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay padres registrados.</p>
        )}
      </div>
    </div>
  );
}
