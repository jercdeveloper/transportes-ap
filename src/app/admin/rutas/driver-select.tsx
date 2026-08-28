"use client";

import { NativeSelect } from "@/components/ui/native-select";

export function DriverSelect({
  action,
  driverId,
  choferes,
}: {
  action: (formData: FormData) => void;
  driverId: string | null;
  choferes: { id: string; full_name: string }[];
}) {
  return (
    <form action={action} className="mt-1">
      <NativeSelect
        key={driverId ?? "none"}
        name="driver_id"
        defaultValue={driverId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-7 max-w-48 text-xs"
      >
        <option value="">Sin chofer asignado</option>
        {choferes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name}
          </option>
        ))}
      </NativeSelect>
    </form>
  );
}
