import type { MedicineStatus } from "@/lib/types"

export const medicineStatusLabel = (status: MedicineStatus) => {
  if (status === "expired") return "Vencido"
  if (status === "expiring_soon") return "Vence em breve"
  return "Em dia"
}

export const medicineStatusClasses = (status: MedicineStatus) => {
  if (status === "expired") {
    return "bg-rose-50 text-danger dark:bg-rose-950/40"
  }
  if (status === "expiring_soon") {
    return "bg-amber-50 text-warning dark:bg-amber-950/40"
  }
  return "bg-emerald-50 text-success dark:bg-emerald-950/40"
}

export const lowStockClasses = "bg-slate-100 text-muted dark:bg-slate-800/60"

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

export const formatExpiration = (month: number, year: number) =>
  `${MONTH_LABELS[month - 1] ?? month}/${year}`

const statusOrder: Record<MedicineStatus, number> = {
  expired: 0,
  expiring_soon: 1,
  ok: 2,
}

export const compareMedicineUrgency = <
  T extends { status: MedicineStatus; isLowStock: boolean },
>(
  a: T,
  b: T
) => {
  const statusDiff = statusOrder[a.status] - statusOrder[b.status]
  if (statusDiff !== 0) return statusDiff
  if (a.isLowStock !== b.isLowStock) return a.isLowStock ? -1 : 1
  return 0
}
