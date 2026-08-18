"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useRef, useState } from "react";
import { searchAddress } from "@/lib/geocode";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { PhotoUploadField } from "@/components/photo-upload-field";
import { MapPin } from "lucide-react";

const StopMapPicker = dynamic(
  () => import("@/components/stop-map-picker").then((m) => m.StopMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-input text-sm text-muted-foreground">
        Cargando mapa...
      </div>
    ),
  }
);

export type StudentFormValues = {
  full_name?: string;
  school_name?: string;
  parent_id?: string;
  address_label?: string;
  lat?: number | null;
  lng?: number | null;
  document_type?: string;
  document_id?: string;
  birth_date?: string;
  grade?: string;
  blood_type?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  default_fee?: number | null;
  photo_url?: string | null;
};

export function StudentForm({
  action,
  padres,
  submitLabel,
  initialValues,
  resetOnSuccess = false,
}: {
  action: (
    state: { error: string } | undefined,
    formData: FormData
  ) => Promise<{ error: string } | undefined>;
  padres: { id: string; full_name: string }[];
  submitLabel: string;
  initialValues?: StudentFormValues;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [addressLabel, setAddressLabel] = useState(
    initialValues?.address_label ?? ""
  );
  const [lat, setLat] = useState<number | null>(initialValues?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialValues?.lng ?? null);
  const [geocodeStatus, setGeocodeStatus] = useState<
    "idle" | "searching" | "not_found"
  >("idle");
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (addressLabel.trim().length < 6) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setGeocodeStatus("searching");
      try {
        const result = await searchAddress(addressLabel, controller.signal);
        if (controller.signal.aborted) return;
        if (result) {
          setLat(result.lat);
          setLng(result.lng);
          setGeocodeStatus("idle");
        } else {
          setGeocodeStatus("not_found");
        }
      } catch {
        if (!controller.signal.aborted) setGeocodeStatus("not_found");
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressLabel]);

  return (
    <Card>
      <CardContent>
        <form
          action={async (formData) => {
            await formAction(formData);
            if (resetOnSuccess) {
              setAddressLabel("");
              setLat(null);
              setLng(null);
              isFirstRunRef.current = true;
            }
          }}
          className="space-y-5"
        >
          <FormSection title="Datos básicos">
            <Field
              label="Nombre del alumno"
              name="full_name"
              defaultValue={initialValues?.full_name}
              required
            />
            <Field
              label="Colegio (opcional)"
              name="school_name"
              defaultValue={initialValues?.school_name}
            />
            <div className="space-y-1.5">
              <Label htmlFor="parent_id">Padre / madre</Label>
              <NativeSelect
                id="parent_id"
                name="parent_id"
                required
                defaultValue={initialValues?.parent_id ?? ""}
              >
                <option value="">Selecciona...</option>
                {padres.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Field
              label="Fecha de nacimiento"
              name="birth_date"
              type="date"
              defaultValue={initialValues?.birth_date}
            />
            <Field
              label="Grado / curso"
              name="grade"
              defaultValue={initialValues?.grade}
              placeholder="Ej: 3° primaria"
            />
            <Field
              label="Tarifa mensual"
              name="default_fee"
              type="number"
              defaultValue={initialValues?.default_fee?.toString()}
              placeholder="Ej: 120000"
            />
            <PhotoUploadField
              bucket="student-photos"
              name="photo_url"
              label="Foto del alumno (opcional)"
              defaultUrl={initialValues?.photo_url}
            />
          </FormSection>

          <Separator />

          <FormSection title="Documento">
            <div className="space-y-1.5">
              <Label htmlFor="document_type">Tipo de documento</Label>
              <NativeSelect
                id="document_type"
                name="document_type"
                defaultValue={initialValues?.document_type ?? ""}
              >
                <option value="">Sin especificar</option>
                <option value="RC">Registro civil</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="CC">Cédula de ciudadanía</option>
              </NativeSelect>
            </div>
            <Field
              label="Número de documento"
              name="document_id"
              defaultValue={initialValues?.document_id}
            />
          </FormSection>

          <Separator />

          <FormSection title="Salud">
            <div className="space-y-1.5">
              <Label htmlFor="blood_type">Tipo de sangre</Label>
              <NativeSelect
                id="blood_type"
                name="blood_type"
                defaultValue={initialValues?.blood_type ?? ""}
              >
                <option value="">Sin especificar</option>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="medical_notes">Alergias / condiciones médicas</Label>
              <Input
                id="medical_notes"
                name="medical_notes"
                defaultValue={initialValues?.medical_notes}
                placeholder="Ej: alergia a la penicilina, asma"
              />
            </div>
          </FormSection>

          <Separator />

          <FormSection title="Contacto de emergencia (además del padre/madre)">
            <Field
              label="Nombre"
              name="emergency_contact_name"
              defaultValue={initialValues?.emergency_contact_name}
            />
            <Field
              label="Teléfono"
              name="emergency_contact_phone"
              defaultValue={initialValues?.emergency_contact_phone}
            />
            <Field
              label="Parentesco"
              name="emergency_contact_relation"
              defaultValue={initialValues?.emergency_contact_relation}
              placeholder="Ej: abuela, tío"
            />
          </FormSection>

          <Separator />

          <div className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <MapPin className="size-4 text-primary" />
              Dirección de recogida
            </h3>
            <Input
              id="address_label"
              name="address_label"
              value={addressLabel}
              onChange={(e) => {
                const value = e.target.value;
                setAddressLabel(value);
                if (value.trim().length < 6) setGeocodeStatus("idle");
              }}
              required
              placeholder="Ej: Carrera 9 # 15-30, Barrio Bolívar"
            />

            <StopMapPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
                setGeocodeStatus("idle");
              }}
            />
            <p className="text-xs text-muted-foreground">
              {geocodeStatus === "searching"
                ? "Buscando la dirección en el mapa..."
                : geocodeStatus === "not_found"
                  ? "No se encontró esa dirección — ajusta el punto haciendo clic en el mapa."
                  : lat != null && lng != null
                    ? `Ubicación: ${lat.toFixed(5)}, ${lng.toFixed(5)} (puedes ajustarla con un clic)`
                    : "Escribe la dirección y el mapa se centrará solo, o haz clic para marcarla a mano."}
            </p>
          </div>

          <input type="hidden" name="lat" value={lat ?? ""} />
          <input type="hidden" name="lng" value={lng ?? ""} />

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending || lat == null || lng == null}>
            {pending ? "Guardando..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </div>
  );
}
