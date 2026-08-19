import type { Medicine } from "@/lib/types"
import type { MedicineFilter } from "@/components/medicine-filter-chips"

export const needsMedicineAttention = (medicine: Medicine) =>
  medicine.status !== "ok" || medicine.isLowStock

export const filterMedicines = (
  medicines: Medicine[],
  filter: MedicineFilter,
  search?: string
) => {
  const query = search?.trim().toLowerCase() ?? ""

  return medicines.filter((medicine) => {
    const matchesSearch =
      !query ||
      medicine.name.toLowerCase().includes(query) ||
      medicine.purpose.some((item) => item.toLowerCase().includes(query)) ||
      medicine.notes.toLowerCase().includes(query)

    if (!matchesSearch) return false

    if (filter === "all") return true
    if (filter === "attention") return needsMedicineAttention(medicine)
    if (filter === "expired") return medicine.status === "expired"
    if (filter === "expiring") return medicine.status === "expiring_soon"
    if (filter === "low") return medicine.isLowStock
    return medicine.status === "ok" && !medicine.isLowStock
  })
}

export const getMedicineFilterCounts = (medicines: Medicine[]) => ({
  all: medicines.length,
  attention: medicines.filter(needsMedicineAttention).length,
  expired: medicines.filter((item) => item.status === "expired").length,
  expiring: medicines.filter((item) => item.status === "expiring_soon").length,
  low: medicines.filter((item) => item.isLowStock).length,
  ok: medicines.filter((item) => item.status === "ok" && !item.isLowStock).length,
})

export const parseMedicineFilter = (value?: string): MedicineFilter => {
  if (
    value === "attention" ||
    value === "expired" ||
    value === "expiring" ||
    value === "low" ||
    value === "ok"
  ) {
    return value
  }
  return "all"
}
