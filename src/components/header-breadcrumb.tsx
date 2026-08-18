"use client"

import Link from "next/link"
import { IconChevron, IconOverview } from "@/components/icons"
import type { PageCrumb } from "@/lib/page-meta"

type HeaderBreadcrumbProps = {
  crumbs: PageCrumb[]
  section: string
}

export const HeaderBreadcrumb = ({ crumbs }: HeaderBreadcrumbProps) => {
  if (crumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-1 items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex min-w-0 items-center gap-0.5 sm:gap-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const Icon = crumb.icon ?? IconOverview
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
                  className="inline-flex max-w-[46vw] min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-foreground active:scale-[0.99] sm:max-w-[18rem] dark:text-slate-400 dark:hover:bg-slate-800"
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
