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
  Routine,
  RoutineToday,
  RoutineOverviewResponse,
  CreateRoutineBody,
  UpdateRoutineBody,
  JournalEntry,
  UpsertJournalEntryBody,
  PersonalGoal,
  PersonalGoalEntry,
  CreatePersonalGoalBody,
  UpdatePersonalGoalBody,
  AddPersonalGoalEntryBody,
  StudySubject,
  StudySession,
  CreateStudySubjectBody,
  UpdateStudySubjectBody,
  LogStudySessionBody,
  CreatePlannedDebtLineBody,
  CreatePlannedExpenseBody,
  UpdatePlannedDebtLineBody,
  CreditCard,
  CreditCardInvoice,
  CreditCardLimit,
  CreditCardRisk,
  CreditCardStatement,
  CreateCreditCardBody,
  CreateCreditCardPurchaseBody,
  CreateInstallmentBody,
  UpdateInstallmentBody,
  Installment,
  Notebook,
  NotebookWithPages,
  NotebookPage,
  NotebookPageSummary,
  NotebookMark,
  CreateNotebookBody,
  UpdateNotebookBody,
  CreateNotebookPageBody,
  UpdateNotebookPageBody,
  CreateNotebookMarkBody,
  Medicine,
  CreateMedicineBody,
  UpdateMedicineBody,
  AdjustMedicineQuantityBody,
  Recipe,
  RecipeCategory,
  RecipeCookHistoryItem,
  RecipeCookSession,
  RecipeListItem,
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

export const createInstallment = (body: CreateInstallmentBody) =>
  apiFetch<Installment>("/installment", { method: "POST", body })

export const updateInstallment = (id: string, body: UpdateInstallmentBody) =>
  apiFetch<Installment>(`/installment/${id}`, { method: "PUT", body })

export const deleteInstallment = (id: string) =>
  apiFetch<{ success: true }>(`/installment/${id}`, { method: "DELETE" })

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

export const receiveRecurringIncome = (id: string) =>
  apiFetch<{ success: true }>(`/recurring-income/${id}/receive`, {
    method: "POST",
  })

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

export const getRoutines = (params?: { includeArchived?: boolean }) => {
  const query = params?.includeArchived ? "?includeArchived=true" : ""
  return apiFetch<Routine[]>(`/routine${query}`)
}

export const getTodayRoutines = () => apiFetch<RoutineToday[]>("/routine/today")

export const getRoutineOverview = (month: number, year: number) =>
  apiFetch<RoutineOverviewResponse>(
    `/routine/overview?month=${month}&year=${year}`
  )

export const createRoutine = (body: CreateRoutineBody) =>
  apiFetch<Routine>("/routine", { method: "POST", body })

export const updateRoutine = (id: string, body: UpdateRoutineBody) =>
  apiFetch<Routine>(`/routine/${id}`, { method: "PATCH", body })

export const archiveRoutine = (id: string) =>
  apiFetch<Routine>(`/routine/${id}/archive`, { method: "POST" })

export const restoreRoutine = (id: string) =>
  apiFetch<Routine>(`/routine/${id}/restore`, { method: "POST" })

export const deleteRoutine = (id: string) =>
  apiFetch<{ success: true }>(`/routine/${id}`, { method: "DELETE" })

export const checkInRoutine = (id: string, date?: string) =>
  apiFetch<{ success: true; date: string }>(`/routine/${id}/check-in`, {
    method: "POST",
    body: date ? { date } : undefined,
  })

export const uncheckRoutine = (id: string, date?: string) =>
  apiFetch<{ success: true; date: string }>(
    `/routine/${id}/check-in${date ? `?date=${date}` : ""}`,
    { method: "DELETE" }
  )

export const getJournalEntries = (
  month: number,
  year: number,
  search?: string
) =>
  apiFetch<JournalEntry[]>(
    `/journal?month=${month}&year=${year}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }`
  )

export const getJournalEntry = (date: string) =>
  apiFetch<JournalEntry | null>(`/journal/${date}`)

export const upsertJournalEntry = (date: string, body: UpsertJournalEntryBody) =>
  apiFetch<JournalEntry>(`/journal/${date}`, { method: "PUT", body })

export const deleteJournalEntry = (date: string) =>
  apiFetch<{ success: true }>(`/journal/${date}`, { method: "DELETE" })

export const getNotebooks = () => apiFetch<Notebook[]>("/notebook")

export const createNotebook = (body: CreateNotebookBody) =>
  apiFetch<Notebook>("/notebook", { method: "POST", body })

export const updateNotebook = (id: string, body: UpdateNotebookBody) =>
  apiFetch<Notebook>(`/notebook/${id}`, { method: "PATCH", body })

export const deleteNotebook = (id: string) =>
  apiFetch<{ success: true }>(`/notebook/${id}`, { method: "DELETE" })

export const getNotebook = (id: string) =>
  apiFetch<NotebookWithPages>(`/notebook/${id}`)

export const createNotebookPage = (notebookId: string, body: CreateNotebookPageBody) =>
  apiFetch<NotebookPageSummary>(`/notebook/${notebookId}/page`, { method: "POST", body })

export const reorderNotebookPages = (notebookId: string, pageIds: string[]) =>
  apiFetch<{ success: true }>(`/notebook/${notebookId}/pages/reorder`, {
    method: "PATCH",
    body: { pageIds },
  })

export const getNotebookPage = (notebookId: string, pageId: string) =>
  apiFetch<NotebookPage>(`/notebook/${notebookId}/page/${pageId}`)

export const updateNotebookPage = (
  notebookId: string,
  pageId: string,
  body: UpdateNotebookPageBody
) =>
  apiFetch<NotebookPage>(`/notebook/${notebookId}/page/${pageId}`, {
    method: "PATCH",
    body,
  })

export const deleteNotebookPage = (notebookId: string, pageId: string) =>
  apiFetch<{ success: true }>(`/notebook/${notebookId}/page/${pageId}`, {
    method: "DELETE",
  })

export const createNotebookMark = (
  notebookId: string,
  pageId: string,
  body: CreateNotebookMarkBody
) =>
  apiFetch<NotebookMark>(`/notebook/${notebookId}/page/${pageId}/mark`, {
    method: "POST",
    body,
  })

export const deleteNotebookMark = (notebookId: string, pageId: string, markId: string) =>
  apiFetch<{ success: true }>(`/notebook/${notebookId}/page/${pageId}/mark/${markId}`, {
    method: "DELETE",
  })

export const getPersonalGoals = (params?: { includeArchived?: boolean }) => {
  const query = params?.includeArchived ? "?includeArchived=true" : ""
  return apiFetch<PersonalGoal[]>(`/personal-goal${query}`)
}

export const getPersonalGoalEntries = (id: string) =>
  apiFetch<PersonalGoalEntry[]>(`/personal-goal/${id}/entries`)

export const createPersonalGoal = (body: CreatePersonalGoalBody) =>
  apiFetch<PersonalGoal>("/personal-goal", { method: "POST", body })

export const updatePersonalGoal = (id: string, body: UpdatePersonalGoalBody) =>
  apiFetch<PersonalGoal>(`/personal-goal/${id}`, { method: "PATCH", body })

export const archivePersonalGoal = (id: string) =>
  apiFetch<PersonalGoal>(`/personal-goal/${id}/archive`, { method: "POST" })

export const restorePersonalGoal = (id: string) =>
  apiFetch<PersonalGoal>(`/personal-goal/${id}/restore`, { method: "POST" })

export const deletePersonalGoal = (id: string) =>
  apiFetch<{ success: true }>(`/personal-goal/${id}`, { method: "DELETE" })

export const addPersonalGoalEntry = (id: string, body: AddPersonalGoalEntryBody) =>
  apiFetch<PersonalGoal>(`/personal-goal/${id}/entry`, { method: "POST", body })

export const getStudySubjects = (params?: { includeArchived?: boolean }) => {
  const query = params?.includeArchived ? "?includeArchived=true" : ""
  return apiFetch<StudySubject[]>(`/study-subject${query}`)
}

export const getStudySessions = (id: string) =>
  apiFetch<StudySession[]>(`/study-subject/${id}/sessions`)

export const createStudySubject = (body: CreateStudySubjectBody) =>
  apiFetch<StudySubject>("/study-subject", { method: "POST", body })

export const updateStudySubject = (id: string, body: UpdateStudySubjectBody) =>
  apiFetch<StudySubject>(`/study-subject/${id}`, { method: "PATCH", body })

export const archiveStudySubject = (id: string) =>
  apiFetch<StudySubject>(`/study-subject/${id}/archive`, { method: "POST" })

export const restoreStudySubject = (id: string) =>
  apiFetch<StudySubject>(`/study-subject/${id}/restore`, { method: "POST" })

export const deleteStudySubject = (id: string) =>
  apiFetch<{ success: true }>(`/study-subject/${id}`, { method: "DELETE" })

export const logStudySession = (id: string, body: LogStudySessionBody) =>
  apiFetch<StudySubject>(`/study-subject/${id}/session`, { method: "POST", body })

export const getMedicines = () => apiFetch<Medicine[]>("/medicine")

export const createMedicine = (body: CreateMedicineBody) =>
  apiFetch<Medicine>("/medicine", { method: "POST", body })

export const updateMedicine = (id: string, body: UpdateMedicineBody) =>
  apiFetch<Medicine>(`/medicine/${id}`, { method: "PATCH", body })

export const adjustMedicineQuantity = (id: string, body: AdjustMedicineQuantityBody) =>
  apiFetch<Medicine>(`/medicine/${id}/adjust`, { method: "PATCH", body })

export const deleteMedicine = (id: string) =>
  apiFetch<{ success: true }>(`/medicine/${id}`, { method: "DELETE" })

export const getRecipeCategories = () =>
  apiFetch<RecipeCategory[]>("/recipe/category")

import { buildRecipeListQuery } from "@/lib/recipe-filters"

export type RecipeListQueryParams = {
  categoryId?: string
  search?: string
  includeArchived?: boolean
  favoritesOnly?: boolean
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  maxTime?: "15" | "30" | "60"
  cooked?: "0" | "1"
  uncategorized?: boolean
  sort?: "recent" | "title" | "cooked" | "quick"
}

const appendRecipeQuery = (query: URLSearchParams, params?: RecipeListQueryParams) => {
  const built = buildRecipeListQuery(params)
  built.forEach((value, key) => query.set(key, value))
}

export const getRecipes = (params?: RecipeListQueryParams) => {
  const query = new URLSearchParams()
  appendRecipeQuery(query, params)
  const suffix = query.toString()
  return apiFetch<RecipeListItem[]>(`/recipe${suffix ? `?${suffix}` : ""}`)
}

export const exportRecipes = (params?: RecipeListQueryParams) => {
  const query = new URLSearchParams()
  appendRecipeQuery(query, params)
  const suffix = query.toString()
  return apiFetch<Recipe[]>(`/recipe/export${suffix ? `?${suffix}` : ""}`)
}

export const getRecipe = (id: string) => apiFetch<Recipe>(`/recipe/${id}`)

export const getRecipeCookSession = (id: string) =>
  apiFetch<RecipeCookSession | null>(`/recipe/${id}/cook-session/active`)

export const getRecipeCookHistory = (id: string) =>
  apiFetch<RecipeCookHistoryItem[]>(`/recipe/${id}/history`)

export const getCreditCards = () => apiFetch<CreditCard[]>("/credit-card")

export const createCreditCard = (body: CreateCreditCardBody) =>
  apiFetch<CreditCard>("/credit-card", { method: "POST", body })

export const deleteCreditCard = (id: string) =>
  apiFetch<CreditCard>(`/credit-card/${id}`, { method: "DELETE" })

export const getCreditCardInvoice = (
  id: string,
  month: number,
  year: number
) =>
  apiFetch<CreditCardInvoice>(
    `/credit-card/${id}/invoice?month=${month}&year=${year}`
  )

export const getCreditCardLimit = (id: string) =>
  apiFetch<CreditCardLimit>(`/credit-card/${id}/limit`)

export const getCreditCardRisk = (id: string) =>
  apiFetch<CreditCardRisk>(`/credit-card/${id}/risk`)

export const getCreditCardStatement = (
  id: string,
  month?: number,
  year?: number
) => {
  const params = new URLSearchParams()
  if (month) params.set("month", String(month))
  if (year) params.set("year", String(year))
  const query = params.toString()
  return apiFetch<CreditCardStatement>(
    `/credit-card/${id}/statement${query ? `?${query}` : ""}`
  )
}

export const createCreditCardPurchase = (
  id: string,
  body: CreateCreditCardPurchaseBody
) =>
  apiFetch<unknown>(`/credit-card/${id}/purchase`, {
    method: "POST",
    body,
  })

export const payCreditCardInvoice = (
  id: string,
  month: number,
  year: number
) =>
  apiFetch<{ paid: number }>(`/credit-card/${id}/pay-invoice`, {
    method: "POST",
    body: { month, year },
  })
