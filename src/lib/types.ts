export type InstallmentStatus = "PAY" | "SCHEDULE"

export type RecurrenceType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"

export type TransactionType = "DEBIT" | "CREDIT" | "PAY"

export type User = {
  id: string
  name: string
  email: string
  amount: number
  createdAt?: string
}

export type Category = {
  id: string
  title: string
  description?: string
  icon?: string | null
  color?: string | null
  parentId?: string | null
  userId?: string | null
  createdAt?: string
  children?: Category[]
}

export type Installment = {
  id: string
  value: number
  status: InstallmentStatus
  order: number
  dateTransaction: string
  debtId: string
}

export type InterestRateType = "MONTHLY" | "DAILY"

export type Debt = {
  id: string
  title: string
  description: string
  interestRate: number
  interestRateType?: InterestRateType
  recurrence: RecurrenceType
  userId: string
  categoryId: string | null
  category?: Category | null
  installments: Installment[]
  createdAt?: string
}

export type MonthInstallment = Installment & {
  totalInstallments: number
  debt: {
    title: string
    description: string
    createdAt: string
    interestRate?: number
    interestRateType?: InterestRateType
  }
}

export type DetailsSummary = {
  recurringIncome: number
  outrasEntradas: number
  totalIncomeFromTransactions: number
  totalIncome: number
  recurringPayments: number
  debts: number
  plannedExpenses?: number
  plannedExpensesOpen?: number
  caixinhaDeposits: number
  caixinhaWithdrawals: number
  caixinhaNetInMonth: number
  caixinhaTotal: number
  otherExpenses?: number
  netStructural?: number
  netExpected: number
  totalExpenses: number
  balanceAfterExpenses: number
}

export type DebtBreakdownItem = {
  id: string
  debtTitle: string
  value: number
  date: string
  paidAt?: string | null
  status: InstallmentStatus
  interestRate?: number
  interestRateType?: InterestRateType
}

export type RecurringPaymentBreakdownItem = {
  id: string
  title: string
  value: number
  dayOfMonth: number
  paidThisMonth: boolean
}

export type RecurringIncomeBreakdownItem = {
  id: string
  title: string
  value: number
  dayOfMonth: number
}

export type ExpenseByCategoryItem = {
  id: string
  title: string
  total: number
}

export type DebtProjectionItem = {
  debtId: string
  title: string
  recurrence: string
  remainingInstallments: number
  remainingValue: number
  averageInstallmentValue: number
  lastInstallmentDate: string
  monthsToComplete: number
  suggestedMonthlyPayment: number
}

export type PlannedExpenseStatus = "SCHEDULED" | "PAID" | "CANCELLED"

export type PlannedExpense = {
  id: string
  title: string
  notes: string
  value: number
  dueDate: string
  status: PlannedExpenseStatus
  paidAt: string | null
  transactionId: string | null
  userId: string
  categoryId: string | null
  category: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}

export type PlannedExpenseBreakdownItem = {
  id: string
  title: string
  notes: string
  value: number
  dueDate: string
  status: PlannedExpenseStatus
  paidAt: string | null
  category: { id: string; title: string } | null
}

export type CreatePlannedExpenseBody = {
  title: string
  notes?: string
  value: number
  dueDate: string
  categoryId?: string | null
}

export type PaymentReminderStatus = "OPEN" | "DONE"
export type PaymentReminderPriority = "LOW" | "MEDIUM" | "HIGH"

export type PaymentReminder = {
  id: string
  title: string
  notes: string
  value: number
  priority: PaymentReminderPriority
  status: PaymentReminderStatus
  doneAt: string | null
  userId: string
  categoryId: string | null
  category: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}

export type CreatePaymentReminderBody = {
  title: string
  notes?: string
  value: number
  priority?: PaymentReminderPriority
  categoryId?: string | null
}

export type CaixinhaBreakdownItem = {
  id: string
  type: "deposit" | "withdrawal"
  value: number
  message: string
  createdAt: string
}

export type MonthDetails = {
  period: {
    month: number
    year: number
    label: string
  }
  summary: DetailsSummary
  recurringIncomeBreakdown?: RecurringIncomeBreakdownItem[]
  recurringPaymentsBreakdown?: RecurringPaymentBreakdownItem[]
  debtsBreakdown: DebtBreakdownItem[]
  plannedExpensesBreakdown?: PlannedExpenseBreakdownItem[]
  expensesByCategory?: ExpenseByCategoryItem[]
  debtProjections?: DebtProjectionItem[]
  caixinhaBreakdown?: CaixinhaBreakdownItem[]
}

export type AmountResponse = {
  amount: number
}

export type SessionResponse = {
  access_token: string
  refresh_token: string
  expires_at: string
  user: User
}

export type RefreshResponse = {
  access_token: string
  user: User
}

export type CreateDebtManualBody = {
  title: string
  description: string | null
  interestRate?: number
  interestRateType?: InterestRateType
  installments: Array<{
    value: number
    status: InstallmentStatus
    date: string
  }>
}

export type CreateDebtRecurrenceBody = {
  title: string
  description: string | null
  interestRate?: number
  interestRateType?: InterestRateType
  value: number
  installmentsCount: number
  recurrence: RecurrenceType
  dayOfMonth?: string
  dayOfWeek?: number
  month?: number
}

export type PlannedDebtStatus = "DRAFT" | "CONSOLIDATED"

export type PlannedDebtMonthCell = {
  month: number
  value: number
  cellId: string | null
}

export type PlannedDebtLineSource =
  | "PLANNED"
  | "RECURRING_PAYMENT"
  | "PLANNED_EXPENSE"

export type PlannedDebtLine = {
  id: string
  title: string
  notes: string
  year: number
  dueDay: number
  sortOrder: number
  interestRate: number
  interestRateType: InterestRateType
  status: PlannedDebtStatus
  consolidatedDebtId: string | null
  userId: string
  createdAt: string
  updatedAt: string
  months: PlannedDebtMonthCell[]
  total: number
  locked?: boolean
  source?: PlannedDebtLineSource
  sourceId?: string
}

export type PlannedDebtSalary = {
  id: string
  title: string
  value: number
}

export type PlannedDebtRecurringPayment = {
  id: string
  title: string
  value: number
  dayOfMonth: number
}

export type PlannedDebtWorkbook = {
  year: number
  lines: PlannedDebtLine[]
  salaries: PlannedDebtSalary[]
  recurringPayments?: PlannedDebtRecurringPayment[]
  monthlySalary: number
  monthTotals: number[]
  surplus: number[]
  yearExpenseTotal: number
  yearSurplus: number
}

export type CreatePlannedDebtLineBody = {
  title: string
  notes?: string
  year: number
  dueDay?: number
  interestRate?: number
  interestRateType?: InterestRateType
  cells?: Array<{ month: number; value: number }>
}

export type UpdatePlannedDebtLineBody = {
  title?: string
  notes?: string
  dueDay?: number
  sortOrder?: number
  interestRate?: number
  interestRateType?: InterestRateType
}

export type Transaction = {
  id: string
  value: number
  message: string
  isRecurring: boolean
  userId: string
  jointAccountId: string | null
  type: TransactionType
  createdAt: string
  categories: Category[]
}

export type CreateTransactionBody = {
  message: string
  value: number
  type: TransactionType
  categories?: string[]
}

export type RecurringPayment = {
  id: string
  title: string
  value: number
  dayOfMonth: number
  lastProcessedAt: string | null
  userId: string
  categoryId: string | null
  createdAt: string
  category?: Category | null
}

export type RecurringIncome = {
  id: string
  title: string
  value: number
  dayOfMonth: number
  lastProcessedAt: string | null
  createdAt: string
  userId?: string
}

export type CreateRecurringPaymentBody = {
  title: string
  value: number
  dayOfMonth: number
  categoryId?: string | null
}

export type CreateRecurringIncomeBody = {
  title: string
  value: number
  dayOfMonth: number
}

export type CreateCategoryBody = {
  title: string
  description?: string | null
  icon?: string | null
  color?: string | null
  parentId?: string | null
}

export type BudgetItem = {
  id: string
  categoryId: string
  categoryTitle: string
  amount: number
  spent: number
  remaining: number
  percentageUsed: number
  month: number
  year: number
}

export type UpsertBudgetBody = {
  categoryId: string
  month: number
  year: number
  amount: number
}

export type ExpensesByCategoryResponse = {
  period: { months: number; startDate: string; endDate: string }
  total: number
  byCategory: Array<{
    id: string
    title: string
    total: number
    percentage: number
  }>
}

export type ExpensesByMonthResponse = {
  period: { months: number; startDate: string; endDate: string }
  byMonth: Array<{ label: string; total: number }>
}

export type EvolutionResponse = {
  period: { months: number; startDate: string; endDate: string }
  monthly: Array<{
    label: string
    month: number
    year: number
    income: number
    expenses: number
    net: number
  }>
}

export type FuturePurchase = {
  id: string
  name: string
  value: number
  valueAdded: number
  dateAcquisition: string
  image?: string | null
  userId: string
  createdAt?: string
}

export type FuturePurchaseProjection = {
  id: string
  name: string
  value: number
  valueAdded: number
  remainingValue: number
  dateAcquisition: string
  suggestedMonthlyToReachByDate: number
  averageMonthlyDeposit: number
  projectedDate: string | null
  monthsUntilTarget: number
  isGoalReached: boolean
}

export type CreateFuturePurchaseBody = {
  name: string
  value: number
  valueAdded?: number
  dateAcquisition: string
}

export type EmergencyReserve = {
  recommendedReserve: number
  currentReserve: number
  monthlyExpenses: number
  monthsTarget: number
  monthsCovered: number
  progressPercent: number
  message: string
  missing: number
}

export type FinancialScoreBreakdownItem = {
  score: number
  maxScore: number
  description: string
}

export type FinancialScore = {
  score: number
  rating: string
  breakdown: {
    debts: FinancialScoreBreakdownItem & {
      totalDebt: number
      monthlyObligations: number
    }
    expenses: FinancialScoreBreakdownItem & {
      monthlyAverage: number
      variable: number
      recurring: number
      debts: number
    }
    income: FinancialScoreBreakdownItem & {
      monthly: number
    }
    reserve: FinancialScoreBreakdownItem & {
      amount: number
      monthsOfReserve: number
    }
  }
  tips: string[]
}

export type SpendingInsights = {
  period: { month: number; year: number; label: string }
  insights: string[]
  averageMonthlySpending: number
  currentMonthSpending: number
  averageBreakdown: {
    variable: number
    recurring: number
    installments: number
    plannedExpenses?: number
  }
  currentBreakdown: {
    variable: number
    recurring: number
    installments: number
    plannedExpenses?: number
  }
  categoryAlerts: Array<{
    categoryId: string
    categoryTitle: string
    currentSpent: number
    averageSpent: number
    percentageIncrease: number
    message: string
  }>
  monthsAnalyzed: number
  tips: string[]
}

export type InstallmentSimulationBody = {
  name: string
  installments: number
  totalValue: number
}

export type InstallmentSimulationResult = {
  simulation: {
    name: string
    installments: number
    monthlyPayment: number
    totalValue: number
  }
  impact: {
    percentOfIncome: number
    description: string
  }
  userSituation: {
    monthlyIncome: number
    monthlyObligations: number
    monthlyExpenses: number
    monthlySurplus: number
    surplusAfterParcel: number
    totalDebt: number
    financialScore: number
  }
  monthlyBreakdown: Array<{
    month: number
    year: number
    label: string
    obligations: number
    newParcel: number
    expenses: number
    surplus: number
    surplusWithParcel: number
  }>
  recommendation: {
    status: "approved" | "caution" | "rejected"
    canAfford: boolean
    message: string
  }
}

export type DueAlert = {
  id: string
  title: string
  value: number
  dueDate: string
  kind: "installment" | "recurring" | "planned_expense"
  urgency: "overdue" | "today" | "tomorrow" | "week"
  href: string
}

export type InsightAlert = {
  id: string
  title: string
  description: string
  tone: "warning" | "danger" | "accent"
  href: string
}

export type DebtPlannerDebt = {
  id: string
  title: string
  remainingValue: number
  minPayment: number
  interestRate: number
}

export type DebtPlannerPayoffItem = {
  title: string
  month: number
}

export type DebtPlannerMonthlyBreakdown = {
  month: number
  paid: number
  remaining: number
}

export type DebtPlannerMethod = {
  monthsToComplete: number
  payoffOrder: DebtPlannerPayoffItem[]
  monthlyBreakdown: DebtPlannerMonthlyBreakdown[]
  description: string
}

export type DebtPlannerResponse = {
  totalDebt: number
  totalMinPayment?: number
  monthlyPayment?: number
  insufficientPayment?: boolean
  warning?: string
  message: string
  debts?: DebtPlannerDebt[]
  snowball: DebtPlannerMethod | null
  avalanche: DebtPlannerMethod | null
}

export type ApiErrorBody = {
  message?: string | string[]
  statusCode?: number
  error?: string
}
