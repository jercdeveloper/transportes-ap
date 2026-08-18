// Crea (o reutiliza) una cuenta admin de prueba para testing local.
// Uso:
//   node --env-file=.env.local scripts/create-test-admin.mjs
//
// No se ejecuta contra producción a menos que .env.local apunte ahí — usa
// las mismas variables que la app (NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY), así que apunta al mismo proyecto Supabase que
// `npm run dev` está usando en este momento.

import { createClient } from "@supabase/supabase-js";

const EMAIL = "admin-test@transportesap.local";
const PASSWORD = "TestAdmin123!";
const FULL_NAME = "Admin de prueba";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Ejecuta con --env-file=.env.local"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await admin.auth.admin.listUsers();
const already = existing?.users?.find((u) => u.email === EMAIL);

let userId = already?.id;

if (!userId) {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) {
    console.error("No se pudo crear el usuario:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
} else {
  console.log("El usuario ya existía, se reutiliza.");
}

const { error: profileError } = await admin
  .from("profiles")
  .upsert({ id: userId, role: "admin", full_name: FULL_NAME }, { onConflict: "id" });

if (profileError) {
  console.error("No se pudo crear/actualizar el perfil:", profileError.message);
  process.exit(1);
}

console.log("Listo. Credenciales de prueba:");
console.log("  Correo:     ", EMAIL);
console.log("  Contraseña: ", PASSWORD);
console.log("\nBórrala cuando termines de probar (Supabase Dashboard → Authentication).");
