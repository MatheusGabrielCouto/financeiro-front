import Link from "next/link"
import { CreateDebtForm } from "@/components/create-debt-form"

const NovaDividaPage = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
        <Link
          href="/dividas"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Voltar para dívidas
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
          Nova dívida
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cadastre por recorrência automática ou informe as parcelas manualmente.
        </p>
      </section>

      <CreateDebtForm />
    </div>
  )
}

export default NovaDividaPage
