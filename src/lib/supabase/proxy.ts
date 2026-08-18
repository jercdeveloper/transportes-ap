import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  chofer: "/chofer",
  padre: "/padre",
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Estas rutas nunca deben ganar/perder acceso según la sesión: la de
  // recuperar contraseña se usa sin sesión, y la de actualizarla llega con
  // una sesión "recovery" temporal creada por el enlace del correo (vía un
  // fragmento #access_token que el servidor nunca ve) — si las tratáramos
  // como protegidas o como "redirige si ya hay sesión", se rompe el flujo.
  const alwaysAccessibleRoute =
    pathname === "/login/actualizar-password" || pathname === "/inscripcion";
  const isPublicRoute =
    pathname === "/login" || pathname === "/" || pathname === "/login/recuperar";

  if (alwaysAccessibleRoute) {
    return response;
  }

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublicRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const home = (profile?.role && ROLE_HOME[profile.role]) ?? "/login";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return response;
}
