import Link from "next/link"
import { InstallmentSimulationForm } from "@/components/installment-simulation-form"

const SimuladorPage = () => {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-6 text-white md:px-7 md:py-7">
          <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/90">
              Decisão de compra
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
              Simulador de parcelas
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Veja se a parcela cabe no mês, antes de comprometer a margem,
              comparando com renda, contas e dívidas atuais.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/financeiro/planejador"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
              >
                Planejador de dívidas
              </Link>
              <Link
                href="/financeiro/parcelas"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
              >
                A pagar este mês
              </Link>
            </div>
          </div>
        </div>
      </section>

      <InstallmentSimulationForm />
    </div>
  )
}

export default SimuladorPage
