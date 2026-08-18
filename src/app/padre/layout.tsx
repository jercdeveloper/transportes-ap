import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function PadreLayout({
  children,
}: LayoutProps<"/padre">) {
  const profile = await requireRole("padre");
  const supabase = await createClient();

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", profile.id)
    .neq("sender_id", profile.id)
    .is("read_at", null);

  return (
    <div className="min-h-screen bg-muted/40">
      <DashboardNav
        title="Padres de familia"
        fullName={profile.full_name}
        showNotificationSettings
        messagesHref="/padre/mensajes"
        hasUnreadMessages={Boolean(count)}
      />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
