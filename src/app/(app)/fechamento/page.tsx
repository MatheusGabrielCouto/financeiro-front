import { Suspense } from "react"
import { redirect } from "next/navigation"
import { FechamentoWizard } from "@/components/fechamento-wizard"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ApiError } from "@/lib/api-server"
import { getCurrentMonthYear } from "@/lib/format"
import {
  getDetails,
  getInstallments,
  getPaymentReminders,
} from "@/lib/finance-api"
import {
  buildPayableItems,
  payableItemHref,
} from "@/lib/payable-items"

type FechamentoPageProps = {
  searchParams: Promise<{ month?: string; year?: string }>
}

const FechamentoPage = async ({ searchParams }: FechamentoPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month ? Number(params.month) : current.month
  const year = params.year ? Number(params.year) : current.year

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12
  ) {
    redirect(`/fechamento?month=${current.month}&year=${current.year}`)
  }

  try {
    const [installments, details, reminders] = await Promise.all([
      getInstallments(month, year),
      getDetails(month, year),
      getPaymentReminders({ status: "OPEN" }).catch(() => []),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const items = buildPayableItems({
      month,
      year,
      installments,
      details,
      today,
    })

    const overdue = items
      .filter((item) => item.isOverdue)
      .map((item) => ({
        id: item.id,
        title: item.title,
        value: item.value,
        dueDate: item.dueDate.toISOString(),
        kind: item.kind,
        href: payableItemHref(item, month, year),
        installmentId: item.installmentId,
        recurringId: item.recurringId,
        plannedId: item.plannedId,
      }))

    const plannedOpen = (details.plannedExpensesBreakdown ?? [])
      .filter((item) => item.status === "SCHEDULED")
      .map((item) => ({
        id: item.id,
        title: item.title,
        value: item.value,
        dueDate: item.dueDate,
        status: item.status,
      }))

    const income =
      details.summary.totalIncome ??
      details.summary.recurringIncome + (details.summary.outrasEntradas ?? 0)
    const expenses = details.summary.totalExpenses
    const surplus =
      details.summary.balanceAfterExpenses ?? details.summary.netExpected
    const pendingTotal = items
      .filter((item) => item.status === "SCHEDULE")
      .reduce((sum, item) => sum + item.value, 0)

    const exportRows = [
      ["Resumo", "Receitas", income, ""],
      ["Resumo", "Saídas", expenses, ""],
      ["Resumo", "Sobra", surplus, ""],
      ["Resumo", "Pendentes (valor)", pendingTotal, ""],
      ["Resumo", "Atrasados (qtd)", overdue.length, ""],
      ["Resumo", "Pra pagar aberto (qtd)", reminders.length, ""],
      ["Resumo", "Previstos abertos (qtd)", plannedOpen.length, ""],
      ...overdue.map((item) => [
        "Atrasado",
        item.title,
        item.value,
        item.kind,
      ]),
      ...reminders.map((item) => [
        "Pra pagar",
        item.title,
        item.value,
        item.priority,
      ]),
      ...plannedOpen.map((item) => [
        "Previsto",
        item.title,
        item.value,
        item.dueDate,
      ]),
    ]

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Suspense
            fallback={<div className="text-sm text-muted">Carregando...</div>}
          >
            <MonthYearFilter month={month} year={year} basePath="/fechamento" />
          </Suspense>
        </div>
        <FechamentoWizard
          month={month}
          year={year}
          overdue={overdue}
          reminders={reminders.map((item) => ({
            id: item.id,
            title: item.title,
            value: item.value,
            notes: item.notes,
            priority: item.priority,
          }))}
          plannedOpen={plannedOpen}
          summary={{
            income,
            expenses,
            surplus,
            pendingTotal,
          }}
          exportRows={exportRows}
        />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default FechamentoPage
