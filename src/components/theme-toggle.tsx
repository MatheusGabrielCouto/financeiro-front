"use client"

import { useEffect, useState } from "react"
import {
  applyThemeClass,
  getSystemDark,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/theme"

const options: Array<{ id: ThemePreference; label: string }> = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Escuro" },
  { id: "system", label: "Sistema" },
]

type ThemeToggleProps = {
  variant?: "header" | "panel"
}

export const ThemeToggle = ({ variant = "header" }: ThemeToggleProps) => {
  const [preference, setPreference] = useState<ThemePreference>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setPreference(readThemePreference())
  }, [])

  useEffect(() => {
    if (!mounted) return

    const sync = () => {
      applyThemeClass(resolveTheme(readThemePreference(), getSystemDark()))
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [mounted])

  const handleSelect = (next: ThemePreference) => {
    setPreference(next)
    writeThemePreference(next)
    applyThemeClass(resolveTheme(next, getSystemDark()))
  }

  if (variant === "panel") {
    return (
      <div
        className="inline-flex rounded-xl border border-border bg-slate-50 p-1 dark:bg-slate-900/60"
        role="group"
        aria-label="Tema da interface"
      >
        {options.map((option) => {
          const active = preference === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  const next =
    preference === "dark"
      ? "light"
      : preference === "light"
        ? "system"
        : "dark"

  const label =
    preference === "dark"
      ? "Tema escuro"
      : preference === "light"
        ? "Tema claro"
        : "Tema do sistema"

  return (
    <button
      type="button"
      onClick={() => handleSelect(next)}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-teal-900/15 bg-surface px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-teal-700/30 hover:bg-teal-50/70 hover:text-accent dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
      aria-label={`${label}. Clique para alternar`}
      title={label}
    >
      {preference === "dark" ? "Escuro" : preference === "light" ? "Claro" : "Auto"}
    </button>
  )
}
