import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/change-password-form";
import { AuthShell } from "@/components/auth-shell";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  chofer: "/chofer",
  padre: "/padre",
};

export default async function CambiarPasswordPage() {
  const profile = await getSessionProfile();
  const home = ROLE_HOME[profile.role] ?? "/";

  return (
    <AuthShell title="Cambiar contraseña" hero={false}>
      <div className="space-y-4">
        <ChangePasswordForm redirectTo={home} />
        <p className="text-center text-xs text-muted-foreground">
          <Link href={home} className="hover:text-foreground hover:underline">
            Cancelar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
