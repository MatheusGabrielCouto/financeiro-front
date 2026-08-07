import { WEEKDAY_LABELS_SHORT, getRoutineColor } from "@/lib/routine-colors"

type RoutineWeekdayChipsProps = {
  weekdays: number[]
  color: string
  size?: "sm" | "xs"
}

export const RoutineWeekdayChips = ({
  weekdays,
  color,
  size = "sm",
}: RoutineWeekdayChipsProps) => {
  const palette = getRoutineColor(color)
  const dimension = size === "sm" ? "h-6 w-6 text-[11px]" : "h-5 w-5 text-[10px]"

  return (
    <div
      className="flex gap-1"
      role="group"
      aria-label="Dias da semana agendados"
    >
      {WEEKDAY_LABELS_SHORT.map((label, day) => {
        const active = weekdays.includes(day)
        return (
          <span
            key={day}
            className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${dimension} ${
              active
                ? `${palette.bg} ${palette.text}`
                : "bg-slate-50 text-slate-300 dark:bg-white/5 dark:text-slate-600"
            }`}
            aria-hidden="true"
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}
