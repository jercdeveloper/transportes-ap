import Link from "next/link";
import { Bus, Bell, MessageCircle, HelpCircle, KeyRound, LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function DashboardNav({
  title,
  fullName,
  showNotificationSettings,
  messagesHref,
  hasUnreadMessages,
}: {
  title: string;
  fullName: string;
  showNotificationSettings?: boolean;
  messagesHref?: string;
  hasUnreadMessages?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bus className="size-4.5" />
        </div>
        <div>
          <p className="text-sm leading-tight font-semibold">Transportes AP</p>
          <p className="text-xs leading-tight text-muted-foreground">{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 hidden text-sm text-muted-foreground sm:inline">
          {fullName}
        </span>
        {messagesHref && (
          <Button variant="ghost" size="icon-sm" render={<Link href={messagesHref} />} className="relative">
            <MessageCircle />
            {hasUnreadMessages && (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-destructive" />
            )}
            <span className="sr-only">Mensajes</span>
          </Button>
        )}
        {showNotificationSettings && (
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href="/cuenta/notificaciones" />}
          >
            <Bell />
            <span className="sr-only">Preferencias de notificación</span>
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" render={<Link href="/ayuda" />}>
          <HelpCircle />
          <span className="sr-only">Ayuda</span>
        </Button>
        <Button variant="ghost" size="icon-sm" render={<Link href="/cuenta/password" />}>
          <KeyRound />
          <span className="sr-only">Cambiar contraseña</span>
        </Button>
        <form action={logout}>
          <Button variant="ghost" size="icon-sm" type="submit">
            <LogOut />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
