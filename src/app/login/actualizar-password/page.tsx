import { ChangePasswordForm } from "@/components/change-password-form";
import { AuthShell } from "@/components/auth-shell";

export default function ActualizarPasswordPage() {
  return (
    <AuthShell
      title="Crea tu nueva contraseña"
      description="Sigue el enlace desde tu correo para llegar aquí."
    >
      <ChangePasswordForm redirectTo="/" />
    </AuthShell>
  );
}
