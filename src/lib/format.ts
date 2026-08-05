export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

export const parseCurrencyInput = (raw: string) => {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return 0
  return Number(digits) / 100
}

export const maskCurrencyInput = (raw: string) => {
  const amount = parseCurrencyInput(raw)
  if (!raw.replace(/\D/g, "")) return ""
  return formatCurrency(amount)
}

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(value))

export const formatMonthLabel = (month: number, year: number) => {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date)
}

export const getCurrentMonthYear = () => {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}
