import Link from "next/link"
import type { ReactNode } from "react"
import { getModuleAccentClasses } from "@/lib/module-accents"
import type { AppModule } from "@/lib/nav-registry"

type ModuleCardProps = {
  module: Pick<AppModule, "label" | "description" | "icon" | "accent" | "href">
  actionLabel?: string
  actionHref?: string
  className?: string
  children?: ReactNode
}

export const ModuleCard = ({
  module,
  actionLabel = "Ver todos",
  actionHref,
  className = "",
  children,
}: ModuleCardProps) => {
  const accent = getModuleAccentClasses(module.accent)
  const Icon = module.icon

  return (
    <article
      className={`rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">{module.label}</h2>
            <p className="mt-0.5 text-sm text-muted">{module.description}</p>
          </div>
        </div>
        <Link
          href={actionHref ?? module.href}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
        >
          {actionLabel}
        </Link>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  )
}
