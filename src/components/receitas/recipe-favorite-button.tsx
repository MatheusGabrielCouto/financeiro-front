"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react"
import { IconStar } from "@/components/icons"

type RecipeFavoriteButtonProps = {
  recipeId: string
  isFavorite: boolean
  variant?: "card" | "detail" | "inline"
  className?: string
}

export const RecipeFavoriteButton = ({
  recipeId,
  isFavorite: initialFavorite,
  variant = "card",
  className = "",
}: RecipeFavoriteButtonProps) => {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsFavorite(initialFavorite)
  }, [initialFavorite])

  const handleToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    const previous = isFavorite
    setIsFavorite(!previous)

    try {
      const response = await fetch(`/api/proxy/recipe/${recipeId}/favorite/toggle`, {
        method: "POST",
      })
      if (!response.ok) {
        setIsFavorite(previous)
        return
      }
      const data = (await response.json()) as { isFavorite: boolean }
      setIsFavorite(data.isFavorite)
      router.refresh()
    } catch {
      setIsFavorite(previous)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.click()
    }
  }

  const variantClass =
    variant === "detail"
      ? "h-10 w-10 rounded-xl border border-white/25 bg-black/30 text-white backdrop-blur-sm hover:bg-black/45"
      : variant === "inline"
        ? "h-9 w-9 rounded-xl border border-border bg-background hover:bg-accent-soft/40"
        : "h-9 w-9 rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm hover:bg-black/50"

  return (
    <button
      type="button"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      className={`inline-flex items-center justify-center transition disabled:opacity-60 ${variantClass} ${className}`}
      aria-label={isFavorite ? "Remover dos favoritos" : "Favoritar receita"}
      aria-pressed={isFavorite}
      tabIndex={0}
    >
      <IconStar
        className={`h-4 w-4 transition ${isFavorite ? "text-amber-300" : "text-current opacity-80"}`}
      />
    </button>
  )
}
