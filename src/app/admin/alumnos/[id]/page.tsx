import { notFound } from "next/navigation";
import { Trash2, ShieldCheck, Receipt, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentForm } from "../student-form";
import {
  updateStudent,
  addAuthorizedPerson,
  removeAuthorizedPerson,
} from "../actions";
import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

export default async function EditStudentPage({
  params,
}: PageProps<"/admin/alumnos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: padres }, { data: authorizedPersons }, { data: payments }] =
    await Promise.all([
      supabase.from("students").select("*").eq("id", id).maybeSingle(),
      supabase.from("profiles").select("id, full_name").eq("role", "padre"),
      supabase
        .from("authorized_pickup_persons")
        .select("id, full_name, phone, document_id, relation")
        .eq("student_id", id),
      supabase
        .from("payments")
        .select("id, period, amount, late_fee, status, paid_at")
        .eq("student_id", id)
        .order("period", { ascending: false }),
    ]);

  if (!student) notFound();

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/alumnos" label="Volver a alumnos" />
        <h1 className="text-xl font-semibold tracking-tight">{student.full_name}</h1>
      </div>

      <StudentForm
        action={updateStudent.bind(null, id)}
        padres={padres ?? []}
        submitLabel="Guardar cambios"
        initialValues={{
          full_name: student.full_name,
          school_name: student.school_name ?? undefined,
          parent_id: student.parent_id,
          address_label: student.address_label ?? undefined,
          lat: student.lat,
          lng: student.lng,
          document_type: student.document_type ?? undefined,
          document_id: student.document_id ?? undefined,
          birth_date: student.birth_date ?? undefined,
          grade: student.grade ?? undefined,
          blood_type: student.blood_type ?? undefined,
          medical_notes: student.medical_notes ?? undefined,
          emergency_contact_name: student.emergency_contact_name ?? undefined,
          emergency_contact_phone: student.emergency_contact_phone ?? undefined,
          emergency_contact_relation:
            student.emergency_contact_relation ?? undefined,
          default_fee: student.default_fee,
          photo_url: student.photo_url,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Personas autorizadas a recoger al alumno
          </CardTitle>
          <CardDescription>
            Además del padre/madre registrado. Útil para que el chofer
            verifique quién puede recibir al alumno en la parada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {authorizedPersons?.length ? (
              authorizedPersons.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.relation ?? "sin parentesco"} · {p.phone ?? "sin teléfono"}
                      {p.document_id ? ` · ${p.document_id}` : ""}
                    </p>
                  </div>
                  <form action={removeAuthorizedPerson.bind(null, id, p.id)}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="submit"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay personas autorizadas registradas.
              </p>
            )}
          </div>

          <form
            action={addAuthorizedPerson.bind(null, id)}
            className="grid gap-2 border-t border-border pt-4 sm:grid-cols-4"
          >
            <Input name="full_name" placeholder="Nombre" required />
            <Input name="relation" placeholder="Parentesco" />
            <Input name="phone" placeholder="Teléfono" />
            <Input name="document_id" placeholder="Documento" />
            <Button type="submit" className="sm:col-span-4">
              Agregar persona autorizada
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            Historial de pagos
          </CardTitle>
          <CardDescription>Todos los periodos registrados para este alumno.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {payments?.length ? (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
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
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay pagos registrados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
