import Link from "next/link"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { ApiError } from "@/lib/api-server"
import { buildDueAlerts, countPriorityAlerts } from "@/lib/due-alerts"
import { formatCurrency, getCurrentMonthYear } from "@/lib/format"
import {
  getCurrentUser,
  getInstallments,
  getRecurringPayments,
} from "@/lib/finance-api"

const PerfilPage = async () => {
  const current = getCurrentMonthYear()
  const nextMonth = current.month === 12 ? 1 : current.month + 1
  const nextYear = current.month === 12 ? current.year + 1 : current.year

  try {
    const [user, installmentsCurrent, installmentsNext, recurringPayments] =
      await Promise.all([
        getCurrentUser(),
        getInstallments(current.month, current.year),
        getInstallments(nextMonth, nextYear),
        getRecurringPayments(),
      ])

    const alerts = buildDueAlerts({
      installments: [...installmentsCurrent, ...installmentsNext],
      recurringPayments,
    })
    const priorityCount = countPriorityAlerts(alerts)
    const initials = user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-teal-900/10 bg-[linear-gradient(135deg,#0b3d3a_0%,#0f766e_55%,#134e4a_100%)] px-5 py-6 text-white shadow-lg shadow-teal-900/10 sm:px-7 sm:py-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur-sm">
              {initials || "U"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/70">
                Perfil
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
                {user.name}
              </h1>
              <p className="mt-1 truncate text-sm text-teal-50/75">{user.email}</p>
            </div>
            <div className="ml-auto rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
              <p className="text-xs text-teal-100/70">Saldo</p>
              <p className="text-lg font-semibold">{formatCurrency(user.amount)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <ProfileForm key={`${user.name}-${user.email}`} user={user} />

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
              <h2 className="text-base font-semibold">Central de alertas</h2>
              <p className="mt-1 text-sm text-muted">
                {priorityCount > 0
                  ? `Há ${priorityCount} alerta(s) prioritário(s) agora.`
                  : "Nenhum alerta prioritário no momento."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/notificacoes"
                  className="inline-flex rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Ver notificações
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    throw error
  }
}

export default PerfilPage
