"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bus,
  LayoutDashboard,
  GraduationCap,
  Route,
  CarFront,
  Users,
  Wallet,
  TriangleAlert,
  ChartColumn,
  UserPlus,
  Megaphone,
  MessageCircle,
  History,
  HelpCircle,
  KeyRound,
  LogOut,
  ShipWheel,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/alumnos", label: "Alumnos", icon: GraduationCap },
  { href: "/admin/rutas", label: "Rutas", icon: Route },
  { href: "/admin/choferes", label: "Choferes", icon: CarFront },
  { href: "/admin/padres", label: "Padres", icon: Users },
  { href: "/admin/pagos", label: "Pagos", icon: Wallet },
  { href: "/admin/incidencias", label: "Incidencias", icon: TriangleAlert },
  { href: "/admin/reportes", label: "Reportes", icon: ChartColumn },
  { href: "/admin/inscripciones", label: "Inscripciones", icon: UserPlus },
  { href: "/admin/avisos", label: "Avisos", icon: Megaphone },
  { href: "/admin/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/admin/auditoria", label: "Auditoría", icon: History },
] as const;

export function AdminSidebar({
  fullName,
  isDriver,
}: {
  fullName: string;
  isDriver?: boolean;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Bus className="size-4.5" />
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Transportes AP</span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              Administración
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isDriver && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/chofer")}
                    tooltip="Mi ruta (chofer)"
                    render={<Link href="/chofer" />}
                  >
                    <ShipWheel />
                    <span>Mi ruta (chofer)</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 overflow-hidden px-2 py-1 group-data-[collapsible=icon]:hidden">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {fullName.slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate text-sm text-sidebar-foreground/90">
                {fullName}
              </span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Ayuda" render={<Link href="/ayuda" />}>
              <HelpCircle />
              <span>Ayuda</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cambiar contraseña"
              render={<Link href="/cuenta/password" />}
            >
              <KeyRound />
              <span>Cambiar contraseña</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logout} className="w-full">
              <SidebarMenuButton tooltip="Cerrar sesión" type="submit">
                <LogOut />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
