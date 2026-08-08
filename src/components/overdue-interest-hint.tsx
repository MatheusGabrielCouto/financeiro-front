"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { IconWarning } from "@/components/icons"
import { formatCurrency } from "@/lib/format"
import {
  calculateOverdueInterest,
  formatInterestRateLabel,
} from "@/lib/overdue-interest"
import type { InterestRateType } from "@/lib/types"

type OverdueInterestHintProps = {
  value: number
  interestRate?: number | null
  interestRateType?: InterestRateType | null
  dueDate: string | Date
  status?: "PAY" | "SCHEDULE"
  className?: string
}

type TooltipPosition = {
  top: number
  left: number
}

export const OverdueInterestHint = ({
  value,
  interestRate,
  interestRateType,
  dueDate,
  status = "SCHEDULE",
  className = "",
}: OverdueInterestHintProps) => {
  const tooltipId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const width = 288
      const gap = 8
      const viewportPadding = 12
      const estimatedHeight = 110

      let left = rect.left + rect.width / 2 - width / 2
      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - width - viewportPadding)
      )

      const spaceBelow = window.innerHeight - rect.bottom
      const top =
        spaceBelow < estimatedHeight + gap + viewportPadding
          ? Math.max(viewportPadding, rect.top - estimatedHeight - gap)
          : rect.bottom + gap

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)

    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [isOpen])

  if (status === "PAY" || !interestRate) {
    return null
  }

  const result = calculateOverdueInterest({
    value,
    interestRate,
    interestRateType,
    dueDate,
  })

  if (!result) {
    return null
  }

  const dayLabel =
    result.daysOverdue === 1 ? "1 dia" : `${result.daysOverdue} dias`

  const message = `Hoje esta dívida carrega cerca de ${formatCurrency(result.interestAmount)} de juros (${dayLabel} após o vencimento · ${formatInterestRateLabel(result.interestRate, result.interestRateType)}). O valor da parcela não foi alterado.`

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false)
    }
  }

  const tooltip =
    mounted && isOpen && position
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[90] w-72 rounded-lg border border-amber-200/90 bg-white px-3 py-2 text-left text-xs leading-relaxed text-amber-950 shadow-lg shadow-slate-900/15 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-100"
            style={{ top: position.top, left: position.left }}
          >
            {message}
          </span>,
          document.body
        )
      : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-amber-600 transition hover:bg-amber-50 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 ${className}`}
        aria-label="Informações de juros da parcela em atraso"
        aria-describedby={isOpen ? tooltipId : undefined}
        tabIndex={0}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        onKeyDown={handleKeyDown}
      >
        <IconWarning className="h-4 w-4" />
      </button>
      {tooltip}
    </>
  )
}
