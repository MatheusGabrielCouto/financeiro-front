import { redirect } from "next/navigation"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { IconPill } from "@/components/icons"
import { MedicineCard } from "@/components/medicine-card"
import { MedicineForm } from "@/components/medicine-form"
import { ApiError } from "@/lib/api-server"
import { getMedicines } from "@/lib/finance-api"
import {
  compareMedicineUrgency,
  formatExpiration,
  medicineStatusLabel,
} from "@/lib/medicine-status"

const RemediosPage = async () => {
  try {
    const medicines = await getMedicines()
    const sorted = [...medicines].sort(compareMedicineUrgency)

    const expiredCount = medicines.filter((item) => item.status === "expired").length
    const expiringSoonCount = medicines.filter(
      (item) => item.status === "expiring_soon"
    ).length
    const lowStockCount = medicines.filter((item) => item.isLowStock).length

    const csvHeaders = [
      "Remédio",
      "Quantidade",
      "Unidade",
      "Para que serve",
      "Validade",
      "Status",
    ]
    const csvRows = sorted.map((item) => [
      item.name,
      item.quantity,
      item.unit,
      item.purpose.join(", "),
      formatExpiration(item.expirationMonth, item.expirationYear),
      medicineStatusLabel(item.status),
    ])

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm shadow-slate-200/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/90">
                Vida pessoal
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                Estoque de remédios
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Remédios que você tem em casa, quantidade, validade e para que
                servem.
              </p>
            </div>

            <div className="relative mt-7 grid grid-cols-3 gap-3 sm:max-w-md">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Cadastrados</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {medicines.length}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Vencidos</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {expiredCount}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Vencendo</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {expiringSoonCount}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            {medicines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-surface px-6 py-14 text-center shadow-sm shadow-slate-200/40">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <IconPill className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold">Cadastre seu primeiro remédio</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Nome, quantidade, validade e para que serve — cadastre ao
                  lado para começar a acompanhar seu estoque.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">Seus remédios</h2>
                  <p className="text-sm text-muted">
                    {medicines.length} cadastrado(s)
                    {lowStockCount > 0 ? `, ${lowStockCount} com estoque baixo` : ""}
                  </p>
                </div>
                <ul className="space-y-3 p-3 md:p-4">
                  {sorted.map((medicine) => (
                    <MedicineCard key={medicine.id} medicine={medicine} />
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 md:px-6">
                  <p className="text-sm text-muted">Exporte o estoque completo.</p>
                  <ExportDataButtons
                    filename="remedios"
                    title="Estoque de remédios"
                    subtitle="Remédios cadastrados"
                    headers={csvHeaders}
                    rows={csvRows}
                    csvLabel="Exportar CSV"
                    pdfLabel="Exportar PDF"
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Novo remédio</h2>
              <p className="mt-1 text-sm text-muted">
                Cadastre o que você tem em casa para acompanhar validade e
                estoque.
              </p>
              <div className="mt-4">
                <MedicineForm />
              </div>
            </div>
          </aside>
        </section>
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default RemediosPage
