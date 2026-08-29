import { Bus, Radio, ShieldCheck, Wallet } from "lucide-react";

const FEATURES = [
  {
    icon: Radio,
    title: "Seguimiento en vivo",
    description: "Ve al bus moverse en el mapa, sin llamadas ni mensajes.",
  },
  {
    icon: ShieldCheck,
    title: "Recogida y entrega confirmadas",
    description: "Cada parada queda registrada al momento.",
  },
  {
    icon: Wallet,
    title: "Pagos claros",
    description: "Estado de cuenta y recibos siempre a la mano.",
  },
];

export function LoginHeroPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[linear-gradient(160deg,oklch(0.511_0.229_276.97)_0%,oklch(0.34_0.16_273)_55%,oklch(0.2_0.09_268)_100%)] px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl"
      />

      <RouteIllustration className="pointer-events-none absolute inset-0 size-full opacity-[0.15]" />

      <div className="relative flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <Bus className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Transportes AP</span>
      </div>

      <div className="relative space-y-10">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Transporte escolar sin sorpresas
          </h2>
          <p className="max-w-sm text-sm text-primary-foreground/75">
            La plataforma que conecta a padres, choferes y administración en
            un solo lugar.
          </p>
        </div>

        <ul className="space-y-5">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <f.icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-sm text-primary-foreground/65">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative" />
    </div>
  );
}

function RouteIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 700"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M60 40 C 220 40, 40 220, 200 260 S 460 340, 320 460 S 80 560, 220 660"
        stroke="white"
        strokeWidth="3"
        strokeDasharray="2 14"
        strokeLinecap="round"
      />
      <circle cx="60" cy="40" r="7" fill="white" />
      <circle cx="200" cy="260" r="7" fill="white" />
      <circle cx="320" cy="460" r="7" fill="white" />
      <circle cx="220" cy="660" r="9" fill="white" />
    </svg>
  );
}
