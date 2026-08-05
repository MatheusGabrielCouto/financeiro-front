type StatCardProps = {
  label: string
  value: string
  hint?: string
  tone?: "default" | "accent" | "warning" | "success" | "danger"
}

const toneStyles = {
  default: {
    value: "text-foreground",
    accent: "bg-slate-100",
  },
  accent: {
    value: "text-accent",
    accent: "bg-accent-soft",
  },
  warning: {
    value: "text-warning",
    accent: "bg-amber-50",
  },
  success: {
    value: "text-success",
    accent: "bg-emerald-50",
  },
  danger: {
    value: "text-danger",
    accent: "bg-red-50",
  },
}

export const StatCard = ({
  label,
  value,
  hint,
  tone = "default",
}: StatCardProps) => {
  const styles = toneStyles[tone]

  return (
    <article className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm shadow-slate-200/40 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={`mt-0.5 h-2 w-2 rounded-full ${styles.accent}`} aria-hidden="true" />
      </div>
      <p
        className={`mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight ${styles.value}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </article>
  )
}
