import { requireRole } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const profile = await requireRole("admin");

  return (
    <SidebarProvider>
      <AdminSidebar fullName={profile.full_name} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <p className="text-sm font-medium text-foreground">Administración</p>
        </header>
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
