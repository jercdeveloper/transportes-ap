import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Trash2, FileDown, FileText, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createStudent, deleteStudent, assignStudentRoute } from "./actions";
import { StudentForm } from "./student-form";
import { RouteAssign } from "./route-assign";
import { SearchBox } from "@/components/search-box";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AlumnosPage({
  searchParams,
}: PageProps<"/admin/alumnos">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  let studentsQuery = supabase
    .from("students")
    .select("id, full_name, school_name, address_label, parent_id");
  if (q) studentsQuery = studentsQuery.ilike("full_name", `%${q}%`);

  const [{ data: students }, { data: padres }, { data: routes }, { data: assignments }] =
    await Promise.all([
      studentsQuery,
      supabase.from("profiles").select("id, full_name").eq("role", "padre"),
      supabase.from("routes").select("id, name"),
      supabase.from("student_route_assignment").select("student_id, route_id, stop_order"),
    ]);

  const parentById = new Map((padres ?? []).map((p) => [p.id, p.full_name]));
  const assignmentByStudent = new Map(
    (assignments ?? []).map((a) => [a.student_id, a])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Alumnos</h1>
        <p className="text-sm text-muted-foreground">
          Alumnos registrados, su dirección de recogida y su ruta asignada.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense>
          <SearchBox placeholder="Buscar alumno por nombre..." />
        </Suspense>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href="/admin/alumnos/importar" />}>
            <Upload /> Importar
          </Button>
          <Button variant="outline" size="sm" render={<a href="/api/export/alumnos" />}>
            <FileDown /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/export/alumnos?format=pdf" />}
          >
            <FileText /> PDF
          </Button>
        </div>
      </div>

      <StudentForm
        action={createStudent}
        padres={padres ?? []}
        submitLabel="Crear alumno"
        resetOnSuccess
      />

      <div className="space-y-3">
        {students?.length ? (
          students.map((s) => {
            const assignment = assignmentByStudent.get(s.id);

            return (
              <Card key={s.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/alumnos/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.full_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {s.school_name ?? "sin colegio"} · Padre/madre:{" "}
                        {parentById.get(s.parent_id) ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {s.address_label ?? "sin dirección"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/admin/alumnos/${s.id}`} />}
                      >
                        <Pencil />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <form action={deleteStudent.bind(null, s.id)}>
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
                  </div>

                  <RouteAssign
                    action={assignStudentRoute.bind(null, s.id)}
                    routes={routes ?? []}
                    currentRouteId={assignment?.route_id ?? null}
                    currentStopOrder={assignment?.stop_order ?? null}
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
