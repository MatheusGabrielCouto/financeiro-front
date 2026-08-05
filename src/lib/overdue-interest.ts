import type { InterestRateType } from "@/lib/types"

export type OverdueInterestInput = {
  value: number
  interestRate: number
  interestRateType?: InterestRateType | null
  dueDate: string | Date
  today?: Date
}

export type OverdueInterestResult = {
  daysOverdue: number
  interestAmount: number
  interestRate: number
  interestRateType: InterestRateType
}

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const diffCalendarDays = (from: Date, to: Date) => {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((to.getTime() - from.getTime()) / msPerDay)
}

const roundMoney = (value: number) => Math.round(value * 100) / 100

export const calculateOverdueInterest = ({
  value,
  interestRate,
  interestRateType = "MONTHLY",
  dueDate,
  today = new Date(),
}: OverdueInterestInput): OverdueInterestResult | null => {
  if (!value || value <= 0 || !interestRate || interestRate <= 0) {
    return null
  }

  const rateType: InterestRateType =
    interestRateType === "DAILY" ? "DAILY" : "MONTHLY"
  const due = startOfDay(new Date(dueDate))
  const now = startOfDay(today)
  const daysOverdue = diffCalendarDays(due, now)

  if (daysOverdue <= 0) {
    return null
  }

  const rate = interestRate / 100
  const interestAmount =
    rateType === "DAILY"
      ? value * rate * daysOverdue
      : value * rate * (daysOverdue / 30)

  if (interestAmount <= 0) {
    return null
  }

  return {
    daysOverdue,
    interestAmount: roundMoney(interestAmount),
    interestRate,
    interestRateType: rateType,
  }
}

export const formatInterestRateLabel = (
  interestRate: number,
  interestRateType?: InterestRateType | null
) => {
  const suffix = interestRateType === "DAILY" ? "a.d." : "a.m."
  return `${interestRate}% ${suffix}`
}
