"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type MonthYearFilterProps = {
  month: number
  year: number
  basePath: string
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export const MonthYearFilter = ({
  month,
  year,
  basePath,
}: MonthYearFilterProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [selectedYear, setSelectedYear] = useState(year)

  useEffect(() => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }, [month, year])

  const navigateTo = (nextMonth: number, nextYear: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("month", String(nextMonth))
    params.set("year", String(nextYear))
    router.push(`${basePath}?${params.toString()}`)
  }

  const handlePrevious = () => {
    const nextMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
    const nextYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
    setSelectedMonth(nextMonth)
    setSelectedYear(nextYear)
    navigateTo(nextMonth, nextYear)
  }

  const handleNext = () => {
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear
    setSelectedMonth(nextMonth)
    setSelectedYear(nextYear)
    navigateTo(nextMonth, nextYear)
  }

  const handleMonthChange = (value: string) => {
    const nextMonth = Number(value)
    setSelectedMonth(nextMonth)
    navigateTo(nextMonth, selectedYear)
  }

  const handleYearChange = (value: string) => {
    const nextYear = Number(value)
    if (!Number.isFinite(nextYear) || nextYear < 2000 || nextYear > 2100) return
    setSelectedYear(nextYear)
    navigateTo(selectedMonth, nextYear)
  }

  const handleGoToCurrent = () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    setSelectedMonth(currentMonth)
    setSelectedYear(currentYear)
    navigateTo(currentMonth, currentYear)
  }

  const now = new Date()
  const isCurrentPeriod =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear()

  const yearOptions = Array.from({ length: 7 }, (_, index) => now.getFullYear() - 3 + index)

  return (
    <div
      className="inline-flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filtro de período"
    >
      <div className="inline-flex items-center rounded-xl border border-border bg-surface shadow-sm shadow-slate-200/40">
        <button
          type="button"
          onClick={handlePrevious}
          className="rounded-l-xl px-3 py-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-foreground"
          aria-label="Mês anterior"
        >
          ‹
        </button>

        <div className="flex items-center gap-1 border-x border-border px-2 py-1.5">
          <label className="sr-only" htmlFor="period-month">
            Mês
          </label>
          <select
            id="period-month"
            value={selectedMonth}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="cursor-pointer appearance-none rounded-lg bg-transparent py-1 pl-2 pr-1 text-sm font-semibold text-foreground outline-none"
            aria-label="Selecionar mês"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="period-year">
            Ano
          </label>
          <select
            id="period-year"
            value={selectedYear}
            onChange={(event) => handleYearChange(event.target.value)}
            className="cursor-pointer appearance-none rounded-lg bg-transparent py-1 pl-1 pr-2 text-sm font-semibold text-foreground outline-none"
            aria-label="Selecionar ano"
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="rounded-r-xl px-3 py-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-foreground"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {!isCurrentPeriod ? (
        <button
          type="button"
          onClick={handleGoToCurrent}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-accent shadow-sm transition hover:bg-accent-soft"
          aria-label="Ir para o mês atual"
        >
          Este mês
        </button>
      ) : (
        <span className="rounded-xl bg-accent-soft px-3 py-2.5 text-xs font-semibold text-accent">
          Atual
        </span>
      )}
    </div>
  )
}
