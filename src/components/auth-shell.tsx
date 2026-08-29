import { Bus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoginHeroPanel } from "@/components/login-hero-panel";

export function AuthShell({
  title,
  description,
  hero = true,
  children,
}: {
  title: string;
  description?: string;
  hero?: boolean;
  children: React.ReactNode;
}) {
  if (!hero) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background px-4 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Bus className="size-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          <Card>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <LoginHeroPanel />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Bus className="size-5.5" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Transportes AP
            </span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
