"use client"

import Link from "next/link"
import { useEffect, useRef, useState, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { IconChevron, IconLogout, IconSimulate, IconUser } from "@/components/icons"
import type { User } from "@/lib/types"

type ProfileMenuProps = {
  user: User | null
}

const getInitials = (name?: string) => {
  if (!name) return "U"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export const ProfileMenu = ({ user }: ProfileMenuProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleKeyDownToggle = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleToggle()
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.replace("/login")
      router.refresh()
    } finally {
      setIsLoggingOut(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDownToggle}
        className="flex max-w-[40vw] items-center gap-2.5 rounded-2xl border border-teal-900/15 bg-teal-700/[0.06] px-1.5 py-1.5 text-left shadow-sm transition hover:border-teal-700/30 hover:bg-teal-700/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:max-w-none sm:pr-2.5 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
        aria-label="Abrir menu do perfil"
        aria-expanded={open}
        aria-haspopup="menu"
        tabIndex={0}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white shadow-sm shadow-teal-700/25">
          {getInitials(user?.name)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold leading-tight text-foreground">
            {user?.name ?? "Usuário"}
          </span>
          <span className="block max-w-[10rem] truncate text-[0.7rem] leading-tight text-muted">
            {user?.email ?? "sua conta"}
          </span>
        </span>
        <IconChevron
          className={`hidden h-4 w-4 shrink-0 text-muted transition sm:block ${
            open ? "-rotate-90" : "rotate-90"
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-slate-200/70"
        >
          <div className="border-b border-border px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? "Usuário"}
            </p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/perfil"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Abrir perfil"
              tabIndex={0}
            >
              <IconUser className="h-4 w-4 text-muted" />
              Meu perfil
            </Link>
            <Link
              href="/interno"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Abrir ferramentas internas"
              tabIndex={0}
            >
              <IconSimulate className="h-4 w-4 text-muted" />
              Ferramentas internas
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-danger transition hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/40"
              aria-label="Sair da conta"
            >
              <IconLogout className="h-4 w-4" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
