import { formatCurrency } from "@/lib/format"

type CreditCardVisualProps = {
  name: string
  brand?: string | null
  lastDigits?: string | null
  dueDay?: number
  closingDay?: number
  available?: number | null
  usedPct?: number | null
  pendingInvoice?: number | null
  size?: "sm" | "md" | "lg"
  className?: string
  interactive?: boolean
}

const themes = [
  "from-[#0b3d3a] via-[#0f766e] to-[#134e4a]",
  "from-slate-900 via-slate-800 to-teal-900",
  "from-[#0f172a] via-[#115e59] to-[#042f2e]",
  "from-zinc-900 via-slate-800 to-emerald-900",
  "from-[#0c4a6e] via-[#0f766e] to-[#134e4a]",
] as const

const hashTheme = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return themes[hash % themes.length]
}

/** ISO/IEC 7810 ID-1 (~85.6 × 54 mm) */
const sizeClass = {
  sm: "max-w-[18rem] rounded-2xl p-3.5",
  md: "max-w-[24rem] rounded-[1.15rem] p-4 sm:p-5",
  lg: "max-w-[28rem] rounded-[1.25rem] p-5 sm:p-6",
} as const

export const CreditCardVisual = ({
  name,
  brand,
  lastDigits,
  dueDay,
  closingDay,
  available,
  usedPct,
  pendingInvoice,
  size = "md",
  className = "",
  interactive = false,
}: CreditCardVisualProps) => {
  const seed = `${name}-${brand ?? ""}-${lastDigits ?? ""}`
  const gradient = hashTheme(seed)
  const digits = (lastDigits ?? "").replace(/\D/g, "").slice(-4)
  const masked = digits ? `•••• •••• •••• ${digits}` : "•••• •••• •••• ••••"
  const showFooter = usedPct != null || (pendingInvoice != null && pendingInvoice > 0)

  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden bg-gradient-to-br ${gradient} text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.65)] ring-1 ring-white/10 ${
        interactive
          ? "transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-18px_rgba(15,23,42,0.7)]"
          : ""
      } ${sizeClass[size]} ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-6 h-28 w-36 rotate-12 rounded-full bg-teal-200/10 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_0%,rgba(255,255,255,0.12)_42%,transparent_58%)]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {brand?.trim() || "Cartão"}
            </p>
            <p
              className={`mt-0.5 truncate font-[family-name:var(--font-display)] font-semibold tracking-tight ${
                size === "sm" ? "text-base" : "text-lg sm:text-xl"
              }`}
            >
              {name.trim() || "Novo cartão"}
            </p>
          </div>
          <div
            className={`flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-200/90 to-amber-500/80 shadow-inner shadow-amber-900/20 ${
              size === "sm" ? "h-7 w-9" : "h-8 w-11"
            }`}
          >
            <div className="h-4 w-7 rounded-[3px] border border-amber-700/20 bg-[repeating-linear-gradient(90deg,rgba(120,53,15,0.15)_0_2px,transparent_2px_4px)] sm:h-5 sm:w-8" />
          </div>
        </div>

        <div>
          <p
            className={`font-mono tracking-[0.2em] text-white/90 ${
              size === "sm" ? "text-sm" : "text-base sm:text-lg"
            }`}
          >
            {masked}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <div className="flex gap-3 text-[10px] uppercase tracking-[0.12em] text-white/55">
              {closingDay ? (
                <span>
                  Fecha <span className="text-white/85">{closingDay}</span>
                </span>
              ) : null}
              {dueDay ? (
                <span>
                  Vence <span className="text-white/85">{dueDay}</span>
                </span>
              ) : null}
            </div>
            {available != null ? (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">
                  Disponível
                </p>
                <p className="text-sm font-semibold tabular-nums text-emerald-200">
                  {formatCurrency(available)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {showFooter ? (
          <div className="space-y-1.5">
            {usedPct != null ? (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-white/60">
                  <span>Limite</span>
                  <span className="tabular-nums">{usedPct}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className={`h-full rounded-full ${
                      usedPct > 80
                        ? "bg-red-300"
                        : usedPct > 50
                          ? "bg-amber-300"
                          : "bg-teal-200"
                    }`}
                    style={{ width: `${Math.min(usedPct, 100)}%` }}
                  />
                </div>
              </div>
            ) : null}
            {pendingInvoice != null && pendingInvoice > 0 ? (
              <p className="text-[11px] font-medium tabular-nums text-amber-100/90">
                Fatura {formatCurrency(pendingInvoice)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
