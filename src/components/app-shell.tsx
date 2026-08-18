"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { KeyboardEvent, useEffect, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { NexoMark } from "@/components/nexo-mark"
import { QuickTransactionLauncher } from "@/components/quick-transaction-launcher"
import { IconChevron, IconClose, IconSidebar } from "@/components/icons"
import { getModuleAccentClasses } from "@/lib/module-accents"
import { AREAS, ALL_MODULES } from "@/lib/nav-registry"
import { getPageMeta } from "@/lib/page-meta"
import type { Category, User } from "@/lib/types"

type AppShellProps = {
  user: User | null
  notificationCount?: number
  categories?: Category[]
  children: React.ReactNode
}

const SIDEBAR_COLLAPSED_KEY = "nexo-sidebar-collapsed"
const SIDEBAR_GROUPS_KEY = "nexo-sidebar-groups"

const defaultOpenGroups = Object.fromEntries(
  ALL_MODULES.map((module) => [module.id, true])
) as Record<string, boolean>

const isItemActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href)

const isImmersiveRoute = (pathname: string) =>
  pathname.startsWith("/planejamento") || pathname.startsWith("/cadernos")

export const AppShell = ({
  user,
  notificationCount = 0,
  categories = [],
  children,
}: AppShellProps) => {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openGroups, setOpenGroups] =
    useState<Record<string, boolean>>(defaultOpenGroups)
  const [prefsReady, setPrefsReady] = useState(false)
  const pageMeta = getPageMeta(pathname)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    try {
      const collapsedRaw = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (collapsedRaw === "1") setSidebarCollapsed(true)

      const groupsRaw = localStorage.getItem(SIDEBAR_GROUPS_KEY)
      if (groupsRaw) {
        const parsed = JSON.parse(groupsRaw) as Record<string, boolean>
        setOpenGroups((current) => ({ ...current, ...parsed }))
      }
    } catch {
      // ignore storage errors
    } finally {
      setPrefsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!prefsReady) return
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0")
  }, [sidebarCollapsed, prefsReady])

  useEffect(() => {
    if (!prefsReady) return
    localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(openGroups))
  }, [openGroups, prefsReady])

  useEffect(() => {
    const activeModule = ALL_MODULES.find((module) =>
      module.navItems.some((item) => isItemActive(pathname, item.href))
    )
    if (!activeModule) return

    setOpenGroups((current) => {
      if (current[activeModule.id]) return current
      return { ...current, [activeModule.id]: true }
    })
  }, [pathname])

  const handleCloseMobile = () => setMobileOpen(false)
  const handleOpenMobile = () => setMobileOpen(true)

  const handleToggleSidebar = () => {
    setSidebarCollapsed((current) => !current)
  }

  const handleToggleGroup = (moduleId: string) => {
    setOpenGroups((current) => ({
      ...current,
      [moduleId]: !current[moduleId],
    }))
  }

  const handleKeyDownAction = (
    event: KeyboardEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      action()
    }
  }

  const renderSidebar = ({
    isRail,
    showMobileClose,
  }: {
    isRail: boolean
    showMobileClose: boolean
  }) => (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`flex h-16 items-center border-b border-sidebar-border/60 ${
          isRail ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center ${isRail ? "" : "gap-2.5"}`}
          aria-label="Ir para o início"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover text-white shadow-md shadow-accent/20">
            <NexoMark className="h-5 w-5" />
          </span>
          {!isRail ? (
            <span>
              <span className="block font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-foreground">
                Nexo
              </span>
              <span className="block text-[11px] text-muted">
                Seu hub pessoal
              </span>
            </span>
          ) : null}
        </Link>

        {showMobileClose ? (
          <button
            type="button"
            className="rounded-lg border border-border p-1.5 text-muted"
            aria-label="Fechar menu"
            tabIndex={0}
            onClick={handleCloseMobile}
            onKeyDown={(event) =>
              handleKeyDownAction(event, handleCloseMobile)
            }
          >
            <IconClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav
        className={`scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-4 pt-3 ${
          isRail ? "px-2" : "px-3"
        }`}
        aria-label="Navegação principal"
      >
        {AREAS.map((area) => (
          <div key={area.id} className="space-y-2">
            {!isRail ? (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70">
                {area.label}
              </p>
            ) : (
              <div
                className="mx-2 border-t border-sidebar-border/60"
                aria-hidden="true"
              />
            )}

            <div className="space-y-1">
              {area.modules.map((module) => {
                const accent = getModuleAccentClasses(module.accent)

                if (module.navItems.length === 1) {
                  const item = module.navItems[0]
                  const Icon = item.icon
                  const active = isItemActive(pathname, item.href)

                  return (
                    <Link
                      key={module.id}
                      href={item.href}
                      title={item.label}
                      className={`flex items-center rounded-xl text-sm transition ${
                        isRail ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
                      } ${
                        active
                          ? `${accent.activeBg} font-semibold ${accent.activeText} shadow-sm ${accent.activeRing}`
                          : "text-slate-600 hover:bg-sidebar-hover hover:text-foreground dark:text-slate-300"
                      }`}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          active
                            ? `${accent.iconBg} ${accent.iconText}`
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {!isRail ? <span>{item.label}</span> : null}
                    </Link>
                  )
                }

                const isGroupOpen = openGroups[module.id] ?? true

                return (
                  <div key={module.id}>
                    {isRail ? (
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(module.id)}
                        onKeyDown={(event) =>
                          handleKeyDownAction(event, () =>
                            handleToggleGroup(module.id)
                          )
                        }
                        className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-sidebar-hover hover:text-foreground"
                        aria-label={`${isGroupOpen ? "Recolher" : "Expandir"} módulo ${module.label}`}
                        aria-expanded={isGroupOpen}
                        title={module.label}
                        tabIndex={0}
                      >
                        <span
                          className={`block h-1 w-1 rounded-full transition ${
                            isGroupOpen ? accent.dot : "bg-slate-300"
                          }`}
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(module.id)}
                        onKeyDown={(event) =>
                          handleKeyDownAction(event, () =>
                            handleToggleGroup(module.id)
                          )
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left transition hover:bg-sidebar-hover"
                        aria-label={`${isGroupOpen ? "Recolher" : "Expandir"} módulo ${module.label}`}
                        aria-expanded={isGroupOpen}
                        tabIndex={0}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {module.label}
                        </span>
                        <IconChevron
                          className={`h-3.5 w-3.5 text-muted transition-transform ${
                            isGroupOpen ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    )}

                    {isGroupOpen ? (
                      <ul className={`space-y-1 ${isRail ? "" : "mt-1"}`}>
                        {module.navItems.map((item) => {
                          const Icon = item.icon
                          const active = isItemActive(pathname, item.href)

                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                title={item.label}
                                className={`flex items-center rounded-xl text-sm transition ${
                                  isRail
                                    ? "justify-center px-2 py-2.5"
                                    : "gap-2.5 px-3 py-2.5"
                                } ${
                                  active
                                    ? `${accent.activeBg} font-semibold ${accent.activeText} shadow-sm ${accent.activeRing}`
                                    : "text-slate-600 hover:bg-sidebar-hover hover:text-foreground dark:text-slate-300"
                                }`}
                                aria-current={active ? "page" : undefined}
                                aria-label={item.label}
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                    active
                                      ? `${accent.iconBg} ${accent.iconText}`
                                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </span>
                                {!isRail ? <span>{item.label}</span> : null}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {!showMobileClose ? (
        <div
          className={`border-t border-sidebar-border/60 p-2 ${
            isRail ? "" : "px-3"
          }`}
        >
          <button
            type="button"
            onClick={handleToggleSidebar}
            onKeyDown={(event) =>
              handleKeyDownAction(event, handleToggleSidebar)
            }
            className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-sidebar-hover hover:text-foreground dark:text-slate-300 ${
              isRail ? "justify-center px-2" : "gap-2.5"
            }`}
            aria-label={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
            tabIndex={0}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <IconSidebar className="h-4 w-4" />
            </span>
            {!isRail ? (
              <span className="font-medium">
                {sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
    </div>
  )

  return (
    <div
      className={`transition-[padding] duration-300 ${
        isImmersiveRoute(pathname)
          ? "h-dvh overflow-hidden"
          : "min-h-screen"
      } ${sidebarCollapsed ? "lg:pl-[4.75rem]" : "lg:pl-64"}`}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border/80 bg-sidebar/90 backdrop-blur-xl transition-[width] duration-300 lg:block ${
          sidebarCollapsed ? "w-[4.75rem]" : "w-64"
        }`}
      >
        {renderSidebar({
          isRail: sidebarCollapsed,
          showMobileClose: false,
        })}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]"
            aria-label="Fechar menu"
            onClick={handleCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(18rem,88vw)] bg-sidebar shadow-2xl">
            {renderSidebar({
              isRail: false,
              showMobileClose: true,
            })}
          </aside>
        </div>
      ) : null}

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          isImmersiveRoute(pathname)
            ? "h-dvh overflow-hidden"
            : "min-h-screen"
        }`}
      >
        <AppHeader
          user={user}
          pageMeta={pageMeta}
          notificationCount={notificationCount}
          mobileOpen={mobileOpen}
          sidebarCollapsed={sidebarCollapsed}
          onOpenMobile={handleOpenMobile}
          onToggleSidebar={handleToggleSidebar}
          onKeyDownAction={handleKeyDownAction}
        />

        <main
          className={`mx-auto w-full min-w-0 flex-1 ${
            isImmersiveRoute(pathname)
              ? "flex min-h-0 max-w-none flex-col overflow-hidden px-3 py-3 md:px-4 md:py-4"
              : "max-w-6xl px-4 py-6 md:px-6 md:py-8"
          }`}
        >
          {children}
        </main>
      </div>

      <KeyboardShortcuts />
      {user ? (
        <QuickTransactionLauncher
          categories={categories}
          variant="shortcut"
        />
      ) : null}
    </div>
  )
}
