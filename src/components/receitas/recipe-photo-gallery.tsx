"use client"

import { ChangeEvent, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { IconTrash } from "@/components/icons"
import type { RecipePhoto } from "@/lib/types"

type RecipePhotoGalleryProps = {
  recipeId: string
  photos: RecipePhoto[]
  coverPhotoId: string | null
}

export const RecipePhotoGallery = ({
  recipeId,
  photos,
  coverPhotoId,
}: RecipePhotoGalleryProps) => {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/recipe-photo/${recipeId}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(typeof data.message === "string" ? data.message : "Erro ao enviar foto")
        return
      }

      router.refresh()
    } catch {
      setError("Erro ao enviar foto")
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleDelete = async (photoId: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/proxy/recipe/${recipeId}/photo/${photoId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        setError("Erro ao remover foto")
        return
      }
      router.refresh()
    } catch {
      setError("Erro ao remover foto")
    }
  }

  const handleSetCover = async (photoId: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/proxy/recipe/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId }),
      })
      if (!response.ok) {
        setError("Erro ao definir capa")
        return
      }
      router.refresh()
    } catch {
      setError("Erro ao definir capa")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Fotos do prato
          </h2>
          <p className="mt-1 text-sm text-muted">
            Registre como ficou cada preparo
          </p>
        </div>
        <label className="interactive-lift cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
          {isUploading ? "Enviando..." : "Adicionar foto"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleUpload}
            aria-label="Enviar foto da receita"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {photos.length === 0 ? (
        <div className="panel-soft rounded-xl px-4 py-10 text-center">
          <p className="text-sm font-medium">Nenhuma foto ainda</p>
          <p className="mt-1 text-xs text-muted">
            Envie fotos para acompanhar seus pratos
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <article key={photo.id} className="panel-soft overflow-hidden rounded-xl">
              <div className="relative aspect-[4/3]">
                <Image
                  src={photo.url}
                  alt={photo.caption || "Foto da receita"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized
                />
                {coverPhotoId === photo.id ? (
                  <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                    Capa
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 p-3">
                {coverPhotoId !== photo.id ? (
                  <button
                    type="button"
                    onClick={() => handleSetCover(photo.id)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold"
                    aria-label="Definir como capa"
                    tabIndex={0}
                  >
                    Usar como capa
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-danger"
                  aria-label="Remover foto"
                  tabIndex={0}
                >
                  <IconTrash className="h-3.5 w-3.5" />
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
