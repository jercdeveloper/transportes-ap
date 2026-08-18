import { Trash2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setEnrollmentStatus, deleteEnrollmentRequest } from "./actions";
import { EnrollmentStatusSelect } from "./status-select";
import { WhatsappLink } from "@/components/whatsapp-link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function InscripcionesPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("enrollment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Solicitudes de inscripción</h1>
        <p className="text-sm text-muted-foreground">
          Enviadas desde el formulario público de inscripción.
        </p>
      </div>

      <div className="space-y-3">
        {requests?.length ? (
          requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {r.student_name}
                    {r.grade ? ` · ${r.grade}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.school_name ?? "Colegio sin especificar"}
                    {r.address_label ? ` · ${r.address_label}` : ""}
                  </p>
                  <p className="mt-1 text-sm">
                    Padre/madre: {r.parent_name} · {r.parent_phone}
                    {r.parent_email ? ` · ${r.parent_email}` : ""}
                  </p>
                  {r.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3">
                    <WhatsappLink phone={r.parent_phone} />
                    {r.parent_email && (
                      <a
                        href={`mailto:${r.parent_email}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Mail className="size-3.5" />
                        Correo
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <EnrollmentStatusSelect
                    action={setEnrollmentStatus.bind(null, r.id)}
                    status={r.status}
                  />
                  <form action={deleteEnrollmentRequest.bind(null, r.id)}>
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
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay solicitudes.</p>
        )}
      </div>
    </div>
  );
}
