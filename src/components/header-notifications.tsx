"use client"

import Link from "next/link"
import { IconBell } from "@/components/icons"

type HeaderNotificationsProps = {
  count: number
}

export const HeaderNotifications = ({ count }: HeaderNotificationsProps) => {
  const label =
    count > 0
      ? `Notificações, ${count} alerta${count === 1 ? "" : "s"} prioritário${count === 1 ? "" : "s"}`
      : "Notificações"

  return (
    <Link
      href="/financeiro/notificacoes"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-900/15 bg-surface text-slate-600 shadow-sm transition hover:border-teal-700/30 hover:bg-teal-50/70 hover:text-accent dark:text-slate-300 dark:hover:bg-teal-950/40"
      aria-label={label}
      tabIndex={0}
    >
      <IconBell className="h-4 w-4" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  )
}
