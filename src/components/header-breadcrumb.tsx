"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import {
  IconBell,
  IconBudget,
  IconCategory,
  IconChevron,
  IconDebts,
  IconInsights,
  IconInstallments,
  IconOverview,
  IconPiggy,
  IconRecurring,
  IconReports,
  IconSimulate,
  IconTransactions,
  IconUser,
} from "@/components/icons"
import type { PageCrumb } from "@/lib/page-meta"

type HeaderBreadcrumbProps = {
  crumbs: PageCrumb[]
  section: string
}

const crumbIcon = (
  label: string,
  section: string
): ComponentType<{ className?: string }> => {
  const key = label.toLowerCase()
  if (key.includes("início")) return IconOverview
  if (key.includes("extrato")) return IconTransactions
  if (key.includes("relat")) return IconReports
  if (key.includes("insight")) return IconInsights
  if (key.includes("notifica")) return IconBell
  if (key.includes("dívida") || key.includes("divida") || key === "detalhe" || key === "nova")
    return IconDebts
  if (key.includes("pagar")) return IconInstallments
  if (key.includes("planilha") || key.includes("planejamento")) return IconReports
  if (key.includes("planej")) return IconDebts
  if (key.includes("simul")) return IconSimulate
  if (key.includes("caixinha")) return IconPiggy
  if (key.includes("conta")) return IconRecurring
  if (key.includes("receita")) return IconTransactions
  if (key.includes("orçamento") || key.includes("orcamento")) return IconBudget
  if (key.includes("categoria")) return IconCategory
  if (key.includes("perfil")) return IconUser
  if (key.includes("interno") || key.includes("ferramenta")) return IconSimulate
  if (section === "Dívidas") return IconDebts
  if (section === "Planejamento") return IconPiggy
  return IconOverview
}

export const HeaderBreadcrumb = ({
  crumbs,
  section,
}: HeaderBreadcrumbProps) => {
  if (crumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-1 items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex min-w-0 items-center gap-0.5 sm:gap-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const Icon = crumbIcon(crumb.label, section)
          const content = (
            <>
              <Icon
                className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${
                  isLast ? "text-accent" : "text-slate-400"
                }`}
              />
              <span className="truncate">{crumb.label}</span>
            </>
          )

          return (
            <li
              key={`${crumb.label}-${index}`}
              className="flex shrink-0 items-center"
            >
              {index > 0 ? (
                <IconChevron
                  className="mx-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 sm:mx-1"
                  aria-hidden="true"
                />
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="inline-flex max-w-[46vw] min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-foreground active:scale-[0.99] sm:max-w-[18rem]"
                  tabIndex={0}
                >
                  {content}
                </Link>
              ) : (
                <span
                  className={`inline-flex max-w-[46vw] min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold sm:max-w-none ${
                    isLast
                      ? "bg-accent-soft/80 text-foreground ring-1 ring-accent/15"
                      : "text-foreground"
                  }`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
