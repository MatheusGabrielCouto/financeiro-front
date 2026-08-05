"use client"

import { ChangeEvent, useEffect, useState } from "react"
import { formatCurrency, parseCurrencyInput } from "@/lib/format"

type CurrencyInputProps = {
  value: number
  onValueChange: (value: number) => void
  id?: string
  name?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  ariaLabel: string
  className?: string
}

export const CurrencyInput = ({
  value,
  onValueChange,
  id,
  name,
  required = false,
  disabled = false,
  placeholder = "R$ 0,00",
  ariaLabel,
  className = "",
}: CurrencyInputProps) => {
  const [display, setDisplay] = useState(value > 0 ? formatCurrency(value) : "")

  useEffect(() => {
    setDisplay(value > 0 ? formatCurrency(value) : "")
  }, [value])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "")

    if (!digits) {
      setDisplay("")
      onValueChange(0)
      return
    }

    const amount = parseCurrencyInput(digits)
    setDisplay(formatCurrency(amount))
    onValueChange(amount)
  }

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      required={required}
      disabled={disabled}
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={
        className ||
        "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent placeholder:text-slate-400 focus:ring-2"
      }
    />
  )
}
