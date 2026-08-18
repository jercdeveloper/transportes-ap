import Link from "next/link";
import { FileDown, FileText, BellRing, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setPayment, sendReminders, generatePayments } from "./actions";
import { PaymentRow } from "./payment-row";
import { ActionMessageButton } from "./send-reminders-button";
import { PeriodNav } from "@/components/period-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { resolveFeesWithSiblingDiscount } from "@/lib/payments";

function shiftPeriod(period: string, months: number) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const GRACE_DAY = 5;

function isLate(period: string) {
  const now = new Date();
  const currentPeriod = now.toISOString().slice(0, 7);
  if (period < currentPeriod) return true;
  return period === currentPeriod && now.getDate() > GRACE_DAY;
}

export default async function PagosPage({
  searchParams,
}: PageProps<"/admin/pagos">) {
  const params = await searchParams;
  const period =
    typeof params.period === "string"
      ? params.period
      : new Date().toISOString().slice(0, 7);

  const supabase = await createClient();

  const [{ data: students }, { data: payments }] = await Promise.all([
    supabase.from("students").select("id, full_name, parent_id, default_fee, created_at"),
    supabase
      .from("payments")
      .select("id, student_id, amount, late_fee, status")
      .eq("period", period),
  ]);

  const paymentByStudent = new Map((payments ?? []).map((p) => [p.student_id, p]));
  const feeByStudent = resolveFeesWithSiblingDiscount(students ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Estado de pago mensual por alumno.
        </p>
      </div>

      <PeriodNav
        basePath="/admin/pagos"
        period={period}
        prevHref={shiftPeriod(period, -1)}
        nextHref={shiftPeriod(period, 1)}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" render={<a href={`/api/export/pagos?period=${period}`} />}>
          <FileDown /> CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<a href={`/api/export/pagos?period=${period}&format=pdf`} />}
        >
          <FileText /> PDF
        </Button>
        <ActionMessageButton
          action={generatePayments.bind(null, period)}
          icon={<Wand2 />}
          label="Generar pagos del mes"
          pendingLabel="Generando..."
        />
        <ActionMessageButton
          action={sendReminders.bind(null, period)}
          icon={<BellRing />}
          label="Recordar pagos pendientes"
          pendingLabel="Enviando..."
        />
      </div>

      <div className="space-y-3">
        {students?.length ? (
          students.map((s) => {
            const payment = paymentByStudent.get(s.id);
            const status = payment?.status ?? "pendiente";
            const late = status === "pendiente" && isLate(period);
            const resolvedFee = feeByStudent.get(s.id) ?? s.default_fee ?? 0;
            const hasSiblingDiscount = !payment && resolvedFee !== (s.default_fee ?? 0);

            return (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/admin/alumnos/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.full_name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {late && <StatusBadge tone="danger">En mora</StatusBadge>}
                      {hasSiblingDiscount && (
                        <StatusBadge tone="info">Descuento por hermano</StatusBadge>
                      )}
                    </div>
                  </div>
                  <PaymentRow
                    action={setPayment.bind(null, s.id, period)}
                    paymentId={payment?.id}
                    amount={payment?.amount ?? resolvedFee}
                    lateFee={payment?.late_fee ?? 0}
                    status={status}
                  />
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay alumnos.</p>
        )}
      </div>
    </div>
  );
}
