const GOOD = "#0ca30c";
const WARNING = "#fab219";
const INK_SECONDARY = "#52514e";
const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";

function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatAmount(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

export function PaymentTrendChart({
  data,
}: {
  data: { period: string; pagado: number; pendiente: number }[];
}) {
  const width = 640;
  const height = 220;
  const paddingLeft = 48;
  const paddingBottom = 24;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft - 12;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxValue = niceMax(Math.max(1, ...data.map((d) => Math.max(d.pagado, d.pendiente))));
  const groupWidth = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.min(20, groupWidth / 2 - 4);

  // Set quita duplicados: con montos pequeños, redondear 0.5 y 1 puede dar
  // el mismo número, lo que dibujaría dos líneas de referencia encimadas.
  const yTicks = [...new Set([0, 0.5, 1].map((f) => Math.round(maxValue * f)))];

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay suficientes datos para mostrar una tendencia.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: GOOD }}
          />
          <span className="text-muted-foreground">Recaudado</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: WARNING }}
          />
          <span className="text-muted-foreground">Pendiente</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Tendencia de pagos recaudados y pendientes por mes"
        className="w-full"
      >
        {yTicks.map((tick, i) => {
          const y = paddingTop + plotHeight - (tick / maxValue) * plotHeight;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                x2={width - 12}
                y1={y}
                y2={y}
                stroke={GRIDLINE}
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill={INK_MUTED}
              >
                {formatAmount(tick)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const groupX = paddingLeft + i * groupWidth;
          const center = groupX + groupWidth / 2;
          const pagadoHeight = (d.pagado / maxValue) * plotHeight;
          const pendienteHeight = (d.pendiente / maxValue) * plotHeight;
          const baseline = paddingTop + plotHeight;

          return (
            <g key={d.period}>
              <title>
                {d.period}: recaudado {formatAmount(d.pagado)}, pendiente{" "}
                {formatAmount(d.pendiente)}
              </title>
              <rect
                x={center - barWidth - 1}
                y={baseline - pagadoHeight}
                width={barWidth}
                height={Math.max(pagadoHeight, 0)}
                rx={4}
                fill={GOOD}
              />
              <rect
                x={center + 1}
                y={baseline - pendienteHeight}
                width={barWidth}
                height={Math.max(pendienteHeight, 0)}
                rx={4}
                fill={WARNING}
              />
              <text
                x={center}
                y={height - 6}
                textAnchor="middle"
                fontSize={10}
                fill={INK_SECONDARY}
              >
                {d.period.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
