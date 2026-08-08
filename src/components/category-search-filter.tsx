"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

type CategorySearchFilterProps = {
  initialQuery?: string
}

export const CategorySearchFilter = ({
  initialQuery = "",
}: CategorySearchFilterProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = query.trim()
      const current = (searchParams.get("q") ?? "").trim()
      if (next === current) return

      const params = new URLSearchParams(searchParams.toString())
      if (next) {
        params.set("q", next)
      } else {
        params.delete("q")
      }

      const href = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname

      startTransition(() => {
        router.replace(href)
      })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [query, pathname, router, searchParams])

  const handleClear = () => {
    setQuery("")
  }

  return (
    <div className="relative w-full max-w-md">
      <label className="sr-only" htmlFor="category-search">
        Buscar categorias
      </label>
      <input
        id="category-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nome ou descrição..."
        className="w-full rounded-xl border border-border bg-background py-2.5 pl-3 pr-20 text-sm outline-none ring-accent focus:ring-2"
        aria-label="Buscar categorias por nome ou descrição"
        autoComplete="off"
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {isPending ? (
          <span className="px-1 text-xs text-muted">...</span>
        ) : null}
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
            aria-label="Limpar busca"
          >
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  )
}
