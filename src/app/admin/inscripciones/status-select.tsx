"use client";

import { NativeSelect } from "@/components/ui/native-select";

export function EnrollmentStatusSelect({
  action,
  status,
}: {
  action: (formData: FormData) => void;
  status: string;
}) {
  return (
    <form action={action}>
      <NativeSelect
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-36"
      >
        <option value="pendiente">Pendiente</option>
        <option value="contactado">Contactado</option>
        <option value="descartado">Descartado</option>
      </NativeSelect>
    </form>
  );
}
