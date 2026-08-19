import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { IconPill, IconWarning } from "@/components/icons"
import { MedicineCard } from "@/components/medicine-card"
import { MedicineFilterChips } from "@/components/medicine-filter-chips"
import { MedicineForm } from "@/components/medicine-form"
import { MedicineSearch } from "@/components/medicine-search"
import { ApiError } from "@/lib/api-server"
import { getMedicines } from "@/lib/finance-api"
import {
  filterMedicines,
  getMedicineFilterCounts,
  needsMedicineAttention,
  parseMedicineFilter,
} from "@/lib/medicine-filters"
import {
  compareMedicineUrgency,
  formatExpiration,
  medicineStatusClasses,
  medicineStatusLabel,
} from "@/lib/medicine-status"

type RemediosPageProps = {
  searchParams: Promise<{ filter?: string; q?: string }>
}

const ToolbarFallback = () => (
  <div className="rounded-2xl border border-border/70 bg-surface p-4">
    <div className="h-12 animate-pulse rounded-2xl bg-accent-soft/30" />
    <div className="mt-4 flex gap-2">
      <div className="h-10 w-24 animate-pulse rounded-full bg-accent-soft/30" />
      <div className="h-10 w-36 animate-pulse rounded-full bg-accent-soft/30" />
    </div>
  </div>
)

const RemediosPage = async ({ searchParams }: RemediosPageProps) => {
  const params = await searchParams
  const activeFilter = parseMedicineFilter(params.filter)
  const searchQuery = params.q?.trim() ?? ""

  try {
    const medicines = await getMedicines()
    const counts = getMedicineFilterCounts(medicines)
    const filtered = filterMedicines(medicines, activeFilter, searchQuery)
    const sorted = [...filtered].sort(compareMedicineUrgency)
    const attentionItems = [...medicines]
      .filter(needsMedicineAttention)
      .sort(compareMedicineUrgency)
      .slice(0, 4)

    const hasFilters = activeFilter !== "all" || Boolean(searchQuery)

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
        <section className="overflow-hidden rounded-3xl border border-border/70 dark:border-border/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/90">
                  Vida pessoal
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  Estoque de remédios
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Controle o que você tem em casa — validade, quantidade e para que serve cada um.
                </p>
              </div>
            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-2xl">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Cadastrados</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {medicines.length}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Atenção</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {counts.attention}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Vencidos</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {counts.expired}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Estoque baixo</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {counts.low}
                </p>
              </article>
            </div>
          </div>
        </section>

        {counts.attention > 0 && !hasFilters ? (
          <section className="rounded-2xl border border-danger/25 bg-danger/5 p-4 md:p-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                <IconWarning className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                  {counts.attention} remédio{counts.attention === 1 ? "" : "s"} precisam de atenção
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Validade vencida, vencendo em breve ou estoque baixo.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {attentionItems.map((medicine) => (
                    <span
                      key={medicine.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium">{medicine.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${medicineStatusClasses(medicine.status)}`}
                      >
                        {medicineStatusLabel(medicine.status)}
                      </span>
                    </span>
                  ))}
                </div>
                <Link
                  href="/pessoal/remedios?filter=attention"
                  className="mt-3 inline-flex text-sm font-semibold text-danger hover:underline"
                >
                  Ver todos que precisam de atenção →
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <Suspense fallback={<ToolbarFallback />}>
          <section className="rounded-2xl border border-border/70 bg-surface p-4 md:p-5">
            <MedicineSearch initialValue={searchQuery} />
            <div className="mt-4">
              <MedicineFilterChips activeFilter={activeFilter} counts={counts} />
            </div>
          </section>
        </Suspense>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
          <div className="space-y-4">
            {medicines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <IconPill className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold">Cadastre seu primeiro remédio</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Use o formulário ao lado para registrar nome, quantidade, validade e uso.
                </p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                <p className="font-semibold">Nenhum remédio corresponde aos filtros</p>
                <p className="mt-1 text-sm text-muted">Tente outro termo ou limpe os filtros.</p>
                <Link
                  href="/pessoal/remedios"
                  className="mt-4 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent-soft/40"
                >
                  Limpar filtros
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                      Seus remédios
                    </h2>
                    <p className="text-sm text-muted">
                      {sorted.length} de {medicines.length} exibido{sorted.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {hasFilters ? (
                    <Link
                      href="/pessoal/remedios"
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Limpar filtros
                    </Link>
                  ) : null}
                </div>

                <ul className="space-y-3">
                  {sorted.map((medicine) => (
                    <MedicineCard key={medicine.id} medicine={medicine} />
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-4">
                  <p className="text-sm text-muted">Exporte o estoque filtrado ou completo.</p>
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

          <aside className="space-y-4 xl:sticky xl:top-24">
            <div className="rounded-2xl border border-border/70 bg-surface p-5">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                Novo remédio
              </h2>
              <p className="mt-1 text-sm text-muted">
                Cadastre o que você tem em casa para acompanhar validade e estoque.
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
