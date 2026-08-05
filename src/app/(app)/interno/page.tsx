import { redirect } from "next/navigation"
import { BrowserReminders } from "@/components/browser-reminders"
import { CronTestPanel } from "@/components/cron-test-panel"
import { ApiError } from "@/lib/api-server"
import { buildDueAlerts } from "@/lib/due-alerts"
import { getCurrentMonthYear } from "@/lib/format"
import {
  getInstallments,
  getRecurringPayments,
} from "@/lib/finance-api"

const InternoPage = async () => {
  const current = getCurrentMonthYear()
  const nextMonth = current.month === 12 ? 1 : current.month + 1
  const nextYear = current.month === 12 ? current.year + 1 : current.year

  try {
    const [installmentsCurrent, installmentsNext, recurringPayments] =
      await Promise.all([
        getInstallments(current.month, current.year),
        getInstallments(nextMonth, nextYear),
        getRecurringPayments(),
      ])

    const alerts = buildDueAlerts({
      installments: [...installmentsCurrent, ...installmentsNext],
      recurringPayments,
    })

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800/80">
            Área interna
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
            Ferramentas de teste
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Uso interno para validar push, lembretes do navegador e execução
            manual das crons. Não faz parte do fluxo do usuário final.
          </p>
        </section>

        <section className="grid min-w-0 gap-4 lg:grid-cols-2">
          <BrowserReminders alerts={alerts} showTestButton />
          <CronTestPanel />
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

export default InternoPage
