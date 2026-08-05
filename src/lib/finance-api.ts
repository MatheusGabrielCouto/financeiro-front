import { apiFetch } from "@/lib/api-server"
import type {
  AmountResponse,
  BudgetItem,
  CreateCategoryBody,
  CreateDebtManualBody,
  CreateDebtRecurrenceBody,
  CreateFuturePurchaseBody,
  CreateRecurringIncomeBody,
  CreateRecurringPaymentBody,
  CreateTransactionBody,
  Debt,
  DebtPlannerResponse,
  EmergencyReserve,
  EvolutionResponse,
  ExpensesByCategoryResponse,
  ExpensesByMonthResponse,
  FinancialScore,
  FuturePurchase,
  FuturePurchaseProjection,
  InstallmentSimulationBody,
  InstallmentSimulationResult,
  MonthDetails,
  MonthInstallment,
  RecurringIncome,
  RecurringPayment,
  SpendingInsights,
  Transaction,
  UpsertBudgetBody,
  Category,
  User,
  PlannedDebtLine,
  PlannedDebtWorkbook,
  PlannedExpense,
  PaymentReminder,
  PaymentReminderStatus,
  CreatePaymentReminderBody,
  CreatePlannedDebtLineBody,
  CreatePlannedExpenseBody,
  UpdatePlannedDebtLineBody,
} from "@/lib/types"

export const getAmount = () => apiFetch<AmountResponse>("/amount")

export const getDetails = (month: number, year: number) =>
  apiFetch<MonthDetails>(`/details?month=${month}&year=${year}`)

export const getDebts = () => apiFetch<Debt[]>("/debt")

export const getDebt = (id: string) => apiFetch<Debt | null>(`/debt/${id}`)

export const createDebt = (body: CreateDebtManualBody) =>
  apiFetch<void>("/debt", { method: "POST", body })

export const createDebtRecurrence = (body: CreateDebtRecurrenceBody) =>
  apiFetch<void>("/debt/recurrence", { method: "POST", body })

export const deleteDebt = (id: string) =>
  apiFetch<void>(`/debt/${id}`, { method: "DELETE" })

export const getInstallments = (month: number, year: number) =>
  apiFetch<MonthInstallment[]>(`/installment?month=${month}&year=${year}`)

export const payInstallment = (id: string) =>
  apiFetch<void>(`/installment/${id}`, { method: "PATCH" })

export const getTransactions = (month: number, year: number, message?: string) => {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
  })
  if (message) params.set("message", message)
  return apiFetch<Transaction[]>(`/transaction?${params.toString()}`)
}

export const createTransaction = (body: CreateTransactionBody) =>
  apiFetch<Transaction>("/transaction", { method: "POST", body })

export const getRecurringPayments = () =>
  apiFetch<RecurringPayment[]>("/recurring-payment")

export const createRecurringPayment = (body: CreateRecurringPaymentBody) =>
  apiFetch<RecurringPayment>("/recurring-payment", { method: "POST", body })

export const payRecurringPayment = (id: string) =>
  apiFetch<{ success: true }>(`/recurring-payment/${id}/pay`, {
    method: "POST",
  })

export const deleteRecurringPayment = (id: string) =>
  apiFetch<void>(`/recurring-payment/${id}`, { method: "DELETE" })

export const getRecurringIncomes = () =>
  apiFetch<RecurringIncome[]>("/recurring-income")

export const createRecurringIncome = (body: CreateRecurringIncomeBody) =>
  apiFetch<RecurringIncome>("/recurring-income", { method: "POST", body })

export const deleteRecurringIncome = (id: string) =>
  apiFetch<void>(`/recurring-income/${id}`, { method: "DELETE" })

export const getCategories = () => apiFetch<Category[]>("/category")

export const createCategory = (body: CreateCategoryBody) =>
  apiFetch<void>("/category", { method: "POST", body })

export const deleteCategory = (id: string) =>
  apiFetch<void>(`/category/${id}`, { method: "DELETE" })

export const getBudgets = (month: number, year: number) =>
  apiFetch<BudgetItem[]>(`/budget?month=${month}&year=${year}`)

export const upsertBudget = (body: UpsertBudgetBody) =>
  apiFetch<BudgetItem>("/budget", { method: "PUT", body })

export const deleteBudget = (id: string) =>
  apiFetch<void>(`/budget/${id}`, { method: "DELETE" })

export const getExpensesByCategory = (months = 6) =>
  apiFetch<ExpensesByCategoryResponse>(
    `/reports/expenses-by-category?months=${months}`
  )

export const getExpensesByMonth = (months = 6) =>
  apiFetch<ExpensesByMonthResponse>(
    `/reports/expenses-by-month?months=${months}`
  )

export const getEvolution = (months = 6) =>
  apiFetch<EvolutionResponse>(`/reports/evolution?months=${months}`)

export const getFuturePurchases = () =>
  apiFetch<FuturePurchase[]>("/future-purchase")

export const getFuturePurchaseProjections = () =>
  apiFetch<FuturePurchaseProjection[]>("/future-purchase/projection")

export const createFuturePurchase = (body: CreateFuturePurchaseBody) =>
  apiFetch<FuturePurchase>("/future-purchase", { method: "POST", body })

export const addFuturePurchaseValue = (id: string, value: number) =>
  apiFetch<FuturePurchase>(`/future-purchase/${id}/add-value`, {
    method: "PATCH",
    body: { value },
  })

export const removeFuturePurchaseValue = (id: string, value: number) =>
  apiFetch<FuturePurchase>(`/future-purchase/${id}/remove-value`, {
    method: "PATCH",
    body: { value },
  })

export const deleteFuturePurchase = (id: string) =>
  apiFetch<{ message: string }>(`/future-purchase/${id}`, { method: "DELETE" })

export const getEmergencyReserve = (months = 6) =>
  apiFetch<EmergencyReserve>(`/emergency-reserve?months=${months}`)

export const getFinancialScore = () =>
  apiFetch<FinancialScore>("/financial-score")

export const getSpendingInsights = (month: number, year: number) =>
  apiFetch<SpendingInsights>(
    `/spending-insights?month=${month}&year=${year}`
  )

export const getDebtPlanner = (effectiveMonthlyPayment?: number) => {
  const params =
    effectiveMonthlyPayment && effectiveMonthlyPayment > 0
      ? `?effectiveMonthlyPayment=${effectiveMonthlyPayment}`
      : ""
  return apiFetch<DebtPlannerResponse>(`/spending-insights/debt-planner${params}`)
}

export const simulateInstallment = (body: InstallmentSimulationBody) =>
  apiFetch<InstallmentSimulationResult>("/installment-simulation", {
    method: "POST",
    body,
  })

export const registerPushToken = (token: string) =>
  apiFetch<{ success: true }>("/push-token", {
    method: "POST",
    body: { token },
  })

export const removePushToken = (token: string) =>
  apiFetch<{ success: true }>("/push-token", {
    method: "DELETE",
    body: { token },
  })

export const sendTestPushNotification = (body?: {
  title?: string
  body?: string
}) =>
  apiFetch<{ success: true; tokens: number }>("/notifications/test", {
    method: "POST",
    body: body ?? {},
  })

export const getCurrentUser = () => apiFetch<User>("/user")

export const updateCurrentUser = (body: {
  name?: string
  email?: string
}) =>
  apiFetch<User>("/user", {
    method: "PATCH",
    body,
  })

export const getPlannedDebtWorkbook = (year: number) =>
  apiFetch<PlannedDebtWorkbook>(`/planned-debt/workbook?year=${year}`)

export const getPlannedDebtLines = (params?: {
  status?: "DRAFT" | "CONSOLIDATED"
  year?: number
}) => {
  const search = new URLSearchParams()
  if (params?.status) search.set("status", params.status)
  if (params?.year) search.set("year", String(params.year))
  const query = search.toString()
  return apiFetch<PlannedDebtLine[]>(
    `/planned-debt${query ? `?${query}` : ""}`
  )
}

export const createPlannedDebtLine = (body: CreatePlannedDebtLineBody) =>
  apiFetch<PlannedDebtLine>("/planned-debt", { method: "POST", body })

export const updatePlannedDebtLine = (
  id: string,
  body: UpdatePlannedDebtLineBody
) => apiFetch<PlannedDebtLine>(`/planned-debt/${id}`, { method: "PATCH", body })

export const upsertPlannedDebtCell = (
  id: string,
  body: { month: number; value: number }
) =>
  apiFetch<PlannedDebtLine>(`/planned-debt/${id}/cell`, {
    method: "PUT",
    body,
  })

export const deletePlannedDebtLine = (id: string) =>
  apiFetch<{ success: true }>(`/planned-debt/${id}`, { method: "DELETE" })

export const consolidatePlannedDebtLine = (id: string) =>
  apiFetch<{ success: true; debt: Debt }>(
    `/planned-debt/${id}/consolidate`,
    { method: "POST" }
  )

export const getPlannedExpenses = (params?: {
  month?: number
  year?: number
  status?: string
}) => {
  const search = new URLSearchParams()
  if (params?.month) search.set("month", String(params.month))
  if (params?.year) search.set("year", String(params.year))
  if (params?.status) search.set("status", params.status)
  const query = search.toString()
  return apiFetch<PlannedExpense[]>(
    `/planned-expense${query ? `?${query}` : ""}`
  )
}

export const createPlannedExpense = (body: CreatePlannedExpenseBody) =>
  apiFetch<PlannedExpense>("/planned-expense", {
    method: "POST",
    body,
  })

export const payPlannedExpense = (id: string) =>
  apiFetch<PlannedExpense>(`/planned-expense/${id}/pay`, { method: "POST" })

export const deletePlannedExpense = (id: string) =>
  apiFetch<{ success: true }>(`/planned-expense/${id}`, { method: "DELETE" })

export const getPaymentReminders = (params?: { status?: string }) => {
  const search = new URLSearchParams()
  if (params?.status) search.set("status", params.status)
  const query = search.toString()
  return apiFetch<PaymentReminder[]>(
    `/payment-reminder${query ? `?${query}` : ""}`
  )
}

export const createPaymentReminder = (body: CreatePaymentReminderBody) =>
  apiFetch<PaymentReminder>("/payment-reminder", {
    method: "POST",
    body,
  })

export const updatePaymentReminder = (
  id: string,
  body: Partial<CreatePaymentReminderBody> & {
    status?: PaymentReminderStatus
  }
) =>
  apiFetch<PaymentReminder>(`/payment-reminder/${id}`, {
    method: "PATCH",
    body,
  })

export const markPaymentReminderDone = (id: string) =>
  apiFetch<PaymentReminder>(`/payment-reminder/${id}/done`, {
    method: "POST",
  })

export const markPaymentReminderUndone = (id: string) =>
  apiFetch<PaymentReminder>(`/payment-reminder/${id}/undone`, {
    method: "POST",
  })

export const paymentReminderToTransaction = (id: string) =>
  apiFetch<PaymentReminder>(`/payment-reminder/${id}/to-transaction`, {
    method: "POST",
  })

export const paymentReminderToPlannedExpense = (id: string) =>
  apiFetch<PaymentReminder>(`/payment-reminder/${id}/to-planned-expense`, {
    method: "POST",
  })

export const deletePaymentReminder = (id: string) =>
  apiFetch<{ success: true }>(`/payment-reminder/${id}`, { method: "DELETE" })
