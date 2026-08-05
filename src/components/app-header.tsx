"use client"

import { KeyboardEvent } from "react"
import { IconMenu, IconSidebar } from "@/components/icons"
import { HeaderBreadcrumb } from "@/components/header-breadcrumb"
import { HeaderNotifications } from "@/components/header-notifications"
import { ProfileMenu } from "@/components/profile-menu"
import type { PageMeta } from "@/lib/page-meta"
import type { User } from "@/lib/types"

type AppHeaderProps = {
  user: User | null
  pageMeta: PageMeta
  notificationCount: number
  mobileOpen: boolean
  sidebarCollapsed: boolean
  onOpenMobile: () => void
  onToggleSidebar: () => void
  onKeyDownAction: (
    event: KeyboardEvent<HTMLButtonElement>,
    action: () => void
  ) => void
}

export const AppHeader = ({
  user,
  pageMeta,
  notificationCount,
  mobileOpen,
  sidebarCollapsed,
  onOpenMobile,
  onToggleSidebar,
  onKeyDownAction,
}: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-teal-900/10 bg-surface/90 shadow-[0_1px_0_0_rgba(13,148,136,0.06)] backdrop-blur-xl">
      <div className="flex min-h-[3.75rem] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 lg:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-900/15 bg-surface text-slate-600 shadow-sm lg:hidden"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          tabIndex={0}
          onClick={onOpenMobile}
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-900/15 bg-surface text-slate-600 shadow-sm transition hover:border-teal-700/30 hover:bg-teal-50/70 hover:text-accent lg:inline-flex"
          aria-label={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
          aria-expanded={!sidebarCollapsed}
          tabIndex={0}
          onClick={onToggleSidebar}
          onKeyDown={(event) => onKeyDownAction(event, onToggleSidebar)}
        >
          <IconSidebar className="h-4 w-4" />
        </button>

        <HeaderBreadcrumb
          crumbs={pageMeta.crumbs}
          section={pageMeta.section}
        />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderNotifications count={notificationCount} />
          <ProfileMenu user={user} />
        </div>
      </div>
    </header>
  )
}
