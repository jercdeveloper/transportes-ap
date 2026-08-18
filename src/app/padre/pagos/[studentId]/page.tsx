import { notFound } from "next/navigation";
import { Receipt } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

export default async function PadrePaymentHistoryPage({
  params,
}: PageProps<"/padre/pagos/[studentId]">) {
  const profile = await requireRole("padre");
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, parent_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student || student.parent_id !== profile.id) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, period, amount, late_fee, status, paid_at")
    .eq("student_id", studentId)
    .order("period", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <BackLink href="/padre" label="Volver" />
        <h1 className="text-xl font-semibold tracking-tight">
          Historial de pagos — {student.full_name}
        </h1>
      </div>

      <div className="space-y-2">
        {payments?.length ? (
          payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{p.period}</p>
                  <p className="text-sm text-muted-foreground">
                    ${p.amount.toLocaleString("es-CO")}
                    {p.late_fee > 0 ? ` + $${p.late_fee.toLocaleString("es-CO")} mora` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={p.status === "pagado" ? "success" : "warning"}>
                    {p.status}
                  </StatusBadge>
                  {p.status === "pagado" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<a href={`/api/export/recibo/${p.id}`} target="_blank" />}
                      title="Descargar recibo"
                    >
                      <Receipt />
                      <span className="sr-only">Descargar recibo</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
        )}
      </div>
    </div>
  );
}
