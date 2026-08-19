import { Suspense } from "react"
import { redirect } from "next/navigation"
import { FechamentoWizard } from "@/components/fechamento-wizard"
import { MonthYearFilter } from "@/components/month-year-filter"
import { ApiError } from "@/lib/api-server"
import { formatMonthLabel, getCurrentMonthYear } from "@/lib/format"
import {
  getDetails,
  getInstallments,
  getPaymentReminders,
} from "@/lib/finance-api"
import { buildMonthFlowBreakdown } from "@/lib/month-flow"
import {
  buildPayableItems,
  payableItemHref,
} from "@/lib/payable-items"
import type { ReportPdfData } from "@/lib/report-pdf"

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
    redirect(`/financeiro/fechamento?month=${current.month}&year=${current.year}`)
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

    const flow = buildMonthFlowBreakdown(details)
    const pendingTotal = items
      .filter((item) => item.status === "SCHEDULE")
      .reduce((sum, item) => sum + item.value, 0)
    const monthLabel = formatMonthLabel(month, year)

    const exportRows = [
      ["Resumo", "Receitas", flow.income, "Entradas do mês"],
      [
        "Resumo",
        "Já pago (extrato)",
        flow.paidExpenses,
        "Saiu no extrato",
      ],
      [
        "Resumo",
        "Ainda em aberto",
        flow.openCommitments,
        "Contas + parcelas + previstos",
      ],
      [
        "Resumo",
        "Sobra só com extrato",
        flow.afterPaidOnly,
        "Receitas - já pago (sem o aberto)",
      ],
      [
        "Resumo",
        "Sobra prevista",
        flow.surplus,
        "Receitas - já pago - ainda em aberto",
      ],
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

    const categories = details.expensesByCategory ?? []
    const categoryTotal = categories.reduce((sum, item) => sum + item.total, 0)

    const reportData: ReportPdfData = {
      monthLabel,
      summary: {
        income: flow.income,
        paidExpenses: flow.paidExpenses,
        openCommitments: flow.openCommitments,
        surplus: flow.surplus,
        structuralSurplus: flow.structuralSurplus,
        afterPaidOnly: flow.afterPaidOnly,
      },
      previous: null,
      categories: categories.map((item) => ({
        title: item.title,
        total: item.total,
        share: categoryTotal > 0 ? (item.total / categoryTotal) * 100 : 0,
      })),
      incomes: (details.recurringIncomeBreakdown ?? []).map((item) => ({
        title: item.title,
        value: item.value,
        detail: `Dia ${item.dayOfMonth}`,
      })),
      recurrings: (details.recurringPaymentsBreakdown ?? []).map((item) => ({
        title: item.title,
        value: item.value,
        detail: item.paidThisMonth ? "Paga" : "Em aberto",
      })),
      debts: (details.debtsBreakdown ?? []).map((item) => ({
        title: item.debtTitle,
        value: item.value,
        detail: item.status === "PAY" ? "Paga" : "Em aberto",
      })),
      planned: (details.plannedExpensesBreakdown ?? []).map((item) => ({
        title: item.title,
        value: item.value,
        detail:
          item.status === "PAID"
            ? "Pago"
            : item.status === "CANCELLED"
              ? "Cancelado"
              : "Em aberto",
      })),
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Suspense
            fallback={<div className="text-sm text-muted">Carregando...</div>}
          >
            <MonthYearFilter month={month} year={year} basePath="/financeiro/fechamento" />
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
            income: flow.income,
            paidExpenses: flow.paidExpenses,
            openCommitments: flow.openCommitments,
            afterPaidOnly: flow.afterPaidOnly,
            surplus: flow.surplus,
            pendingTotal,
          }}
          exportRows={exportRows}
          reportData={reportData}
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
