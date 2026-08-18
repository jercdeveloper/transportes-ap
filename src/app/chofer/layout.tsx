import { requireRole } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function ChoferLayout({
  children,
}: LayoutProps<"/chofer">) {
  const profile = await requireRole("chofer");

  return (
    <div className="min-h-screen bg-muted/40">
      <DashboardNav title="Chofer" fullName={profile.full_name} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
