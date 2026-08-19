"use client"

import { useEffect, useRef, useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { JournalFormatToolbar } from "@/components/journal-format-toolbar"
import { RichTextEditor } from "@/components/rich-text-editor"
import { IconTrash } from "@/components/icons"
import { NotebookShelf } from "@/components/cadernos/notebook-shelf"
import { PageList } from "@/components/cadernos/page-list"
import { MarksPanel } from "@/components/cadernos/marks-panel"
import { flashMark, unwrapMark, type WrapSelectionResult } from "@/lib/notebook-mark"
import type { NotebookColorToken } from "@/lib/notebook-colors"
import type {
  Notebook,
  NotebookMark,
  NotebookPage,
  NotebookPageSummary,
  NotebookWithPages,
} from "@/lib/types"

type CadernosAppProps = {
  initialNotebooks: Notebook[]
  initialNotebook: NotebookWithPages | null
  initialPage: NotebookPage | null
}

type SaveStatus = "idle" | "typing" | "saving" | "saved" | "error"

type DeleteTarget =
  | { type: "notebook"; id: string; label: string }
  | { type: "page"; id: string; label: string }

class ProxyRequestError extends Error {}

const proxyFetch = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ProxyRequestError(
      typeof data.message === "string" ? data.message : "Não foi possível concluir a ação"
    )
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

const syncUrl = (notebookId: string | null, pageId: string | null) => {
  const params = new URLSearchParams()
  if (notebookId) params.set("notebook", notebookId)
  if (pageId) params.set("page", pageId)
  const query = params.toString()
  window.history.replaceState(null, "", query ? `/pessoal/cadernos?${query}` : "/pessoal/cadernos")
}

const SAVE_STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  typing: "Digitando…",
  saving: "Salvando…",
  saved: "Salvo",
  error: "Não foi possível salvar",
}

export const CadernosApp = ({
  initialNotebooks,
  initialNotebook,
  initialPage,
}: CadernosAppProps) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(initialNotebooks)
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(
    initialNotebook?.id ?? null
  )
  const [pages, setPages] = useState<NotebookPageSummary[]>(initialNotebook?.pages ?? [])
  const [activePageId, setActivePageId] = useState<string | null>(initialPage?.id ?? null)
  const [page, setPage] = useState<NotebookPage | null>(initialPage)
  const [pageTitleInput, setPageTitleInput] = useState(initialPage?.title ?? "")
  const [marks, setMarks] = useState<NotebookMark[]>(initialPage?.marks ?? [])
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [isLoadingNotebook, setIsLoadingNotebook] = useState(false)
  const [isLoadingPage, setIsLoadingPage] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingContentRef = useRef<string | null>(null)
  const activeIdsRef = useRef({ notebookId: activeNotebookId, pageId: activePageId })
  useEffect(() => {
    activeIdsRef.current = { notebookId: activeNotebookId, pageId: activePageId }
  }, [activeNotebookId, activePageId])

  const flushSave = async (): Promise<boolean> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    const content = pendingContentRef.current
    const { notebookId, pageId } = activeIdsRef.current
    if (content === null || !notebookId || !pageId) return true

    pendingContentRef.current = null
    setSaveStatus("saving")
    try {
      const updated = await proxyFetch<NotebookPage>(`/notebook/${notebookId}/page/${pageId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      })
      setMarks(updated.marks)
      setSaveStatus("saved")
      setPages((prev) =>
        prev.map((item) => (item.id === pageId ? { ...item, updatedAt: updated.updatedAt } : item))
      )
      return true
    } catch {
      setSaveStatus("error")
      pendingContentRef.current = content
      return false
    }
  }

  const scheduleSave = (html: string) => {
    pendingContentRef.current = html
    setSaveStatus("typing")
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      void flushSave()
    }, 1200)
  }

  useEffect(() => {
    const handler = () => {
      void flushSave()
    }
    window.addEventListener("beforeunload", handler)
    document.addEventListener("visibilitychange", handler)
    return () => {
      window.removeEventListener("beforeunload", handler)
      document.removeEventListener("visibilitychange", handler)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const selectPage = async (notebookId: string, pageId: string) => {
    await flushSave()
    setIsLoadingPage(true)
    setGlobalError(null)
    try {
      const data = await proxyFetch<NotebookPage>(`/notebook/${notebookId}/page/${pageId}`)
      setActivePageId(pageId)
      setPage(data)
      setPageTitleInput(data.title)
      setMarks(data.marks)
      setSaveStatus("idle")
      syncUrl(notebookId, pageId)
    } catch {
      setGlobalError("Não foi possível abrir a página")
    } finally {
      setIsLoadingPage(false)
    }
  }

  const clearActivePage = (notebookId: string | null) => {
    setActivePageId(null)
    setPage(null)
    setMarks([])
    setPageTitleInput("")
    syncUrl(notebookId, null)
  }

  const selectNotebook = async (notebookId: string) => {
    if (notebookId === activeNotebookId) return
    await flushSave()
    setIsLoadingNotebook(true)
    setGlobalError(null)
    try {
      const data = await proxyFetch<NotebookWithPages>(`/notebook/${notebookId}`)
      setActiveNotebookId(notebookId)
      setPages(data.pages)
      if (data.pages[0]) {
        await selectPage(notebookId, data.pages[0].id)
      } else {
        clearActivePage(notebookId)
      }
    } catch {
      setGlobalError("Não foi possível abrir o caderno")
    } finally {
      setIsLoadingNotebook(false)
    }
  }

  const handleCreateNotebook = async (data: {
    title: string
    emoji: string
    color: NotebookColorToken
  }) => {
    const notebook = await proxyFetch<Notebook>("/notebook", {
      method: "POST",
      body: JSON.stringify(data),
    })
    setNotebooks((prev) => [...prev, notebook])
    await selectNotebook(notebook.id)
  }

  const handleCreatePage = async () => {
    if (!activeNotebookId) return
    const summary = await proxyFetch<NotebookPageSummary>(`/notebook/${activeNotebookId}/page`, {
      method: "POST",
      body: JSON.stringify({}),
    })
    setPages((prev) => [...prev, summary])
    setNotebooks((prev) =>
      prev.map((n) => (n.id === activeNotebookId ? { ...n, pageCount: n.pageCount + 1 } : n))
    )
    await selectPage(activeNotebookId, summary.id)
  }

  const handleMovePage = async (pageId: string, direction: -1 | 1) => {
    const idx = pages.findIndex((p) => p.id === pageId)
    const swapIdx = idx + direction
    if (idx < 0 || swapIdx < 0 || swapIdx >= pages.length || !activeNotebookId) return

    const next = [...pages]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    setPages(next)

    try {
      await proxyFetch(`/notebook/${activeNotebookId}/pages/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ pageIds: next.map((p) => p.id) }),
      })
    } catch {
      setPages(pages)
      setGlobalError("Não foi possível reordenar as páginas")
    }
  }

  const handleTitleBlur = async () => {
    if (!activeNotebookId || !activePageId || !page) return
    if (pageTitleInput.trim() === page.title) return
    const title = pageTitleInput.trim() || "Sem título"
    try {
      const updated = await proxyFetch<NotebookPage>(
        `/notebook/${activeNotebookId}/page/${activePageId}`,
        { method: "PATCH", body: JSON.stringify({ title }) }
      )
      setPage(updated)
      setPageTitleInput(updated.title)
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId ? { ...p, title: updated.title, updatedAt: updated.updatedAt } : p
        )
      )
    } catch {
      setPageTitleInput(page.title)
      setGlobalError("Não foi possível renomear a página")
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === "notebook") {
        await proxyFetch(`/notebook/${deleteTarget.id}`, { method: "DELETE" })
        const remaining = notebooks.filter((n) => n.id !== deleteTarget.id)
        setNotebooks(remaining)
        if (activeNotebookId === deleteTarget.id) {
          if (remaining[0]) {
            await selectNotebook(remaining[0].id)
          } else {
            setActiveNotebookId(null)
            setPages([])
            clearActivePage(null)
          }
        }
      } else if (activeNotebookId) {
        await proxyFetch(`/notebook/${activeNotebookId}/page/${deleteTarget.id}`, {
          method: "DELETE",
        })
        const remaining = pages.filter((p) => p.id !== deleteTarget.id)
        setPages(remaining)
        setNotebooks((prev) =>
          prev.map((n) =>
            n.id === activeNotebookId ? { ...n, pageCount: Math.max(0, n.pageCount - 1) } : n
          )
        )
        if (activePageId === deleteTarget.id) {
          if (remaining[0]) {
            await selectPage(activeNotebookId, remaining[0].id)
          } else {
            clearActivePage(activeNotebookId)
          }
        }
      }
      setDeleteTarget(null)
    } catch {
      setGlobalError("Não foi possível excluir")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMark = async (result: WrapSelectionResult) => {
    if (!activeNotebookId || !activePageId || !editorRef.current) return
    pendingContentRef.current = editorRef.current.innerHTML
    const ok = await flushSave()
    if (!ok) {
      unwrapMark(editorRef.current, result.id)
      return
    }
    try {
      const mark = await proxyFetch<NotebookMark>(
        `/notebook/${activeNotebookId}/page/${activePageId}/mark`,
        { method: "POST", body: JSON.stringify({ markId: result.id, snippet: result.snippet }) }
      )
      setMarks((prev) => [...prev, mark])
    } catch {
      unwrapMark(editorRef.current, result.id)
      pendingContentRef.current = editorRef.current.innerHTML
      void flushSave()
      setGlobalError("Não foi possível salvar a marcação")
    }
  }

  const handleJumpToMark = (markId: string) => {
    flashMark(editorRef.current, markId)
  }

  const handleDeleteMark = async (markId: string) => {
    if (!activeNotebookId || !activePageId || !editorRef.current) return
    unwrapMark(editorRef.current, markId)
    setMarks((prev) => prev.filter((m) => m.id !== markId))
    pendingContentRef.current = editorRef.current.innerHTML
    void flushSave()
    try {
      await proxyFetch(`/notebook/${activeNotebookId}/page/${activePageId}/mark/${markId}`, {
        method: "DELETE",
      })
    } catch {
      // content save already dropped the mark from the index locally; a stale
      // server-side row will be swept on the next content save's orphan cleanup
    }
  }

  const isBusy = isLoadingNotebook || isLoadingPage

  return (
    <div className="flex h-full min-h-0 flex-col text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3 md:px-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-tight">
          Cadernos
        </h1>
        <NotebookShelf
          notebooks={notebooks}
          activeNotebookId={activeNotebookId}
          isBusy={isBusy}
          onSelect={(id) => void selectNotebook(id)}
          onCreate={handleCreateNotebook}
          onDelete={(id, title) => setDeleteTarget({ type: "notebook", id, label: title })}
        />
      </header>

      {globalError ? (
        <p className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger md:px-6">
          {globalError}
        </p>
      ) : null}

      {notebooks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div className="max-w-sm space-y-2">
            <p className="font-[family-name:var(--font-fraunces)] text-lg">
              Crie seu primeiro caderno
            </p>
            <p className="text-sm text-muted">
              Organize suas anotações de estudo por assunto — Inglês, Contabilidade, o que
              precisar.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="min-h-0 shrink-0 border-b border-border/70 px-4 py-3 lg:w-48 lg:border-b-0 lg:border-r lg:px-3">
            <PageList
              pages={pages}
              activePageId={activePageId}
              isBusy={isBusy}
              onSelect={(id) => void selectPage(activeNotebookId as string, id)}
              onCreate={handleCreatePage}
              onDelete={(id, title) =>
                setDeleteTarget({ type: "page", id, label: title || "Sem título" })
              }
              onMove={(id, direction) => void handleMovePage(id, direction)}
            />
          </aside>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            {!page ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted">
                {pages.length === 0
                  ? "Crie uma página para começar a escrever."
                  : "Selecione uma página."}
              </div>
            ) : (
              <div className="mx-auto flex max-w-[68ch] flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    value={pageTitleInput}
                    onChange={(event) => setPageTitleInput(event.target.value)}
                    onBlur={() => void handleTitleBlur()}
                    placeholder="Sem título"
                    className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-fraunces)] text-2xl font-semibold outline-none placeholder:text-muted"
                    aria-label="Título da página"
                  />
                  <div className="flex items-center gap-2">
                    {saveStatus !== "idle" ? (
                      <span
                        className={`text-xs ${
                          saveStatus === "error" ? "text-danger" : "text-muted"
                        }`}
                      >
                        {SAVE_STATUS_LABEL[saveStatus]}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: "page",
                          id: page.id,
                          label: page.title || "Sem título",
                        })
                      }
                      className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-danger"
                      aria-label="Excluir página"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <JournalFormatToolbar editorRef={editorRef} onMark={(result) => void handleMark(result)} />

                <RichTextEditor
                  key={activePageId}
                  editorRef={editorRef}
                  content={page.content}
                  onChangeHtml={scheduleSave}
                  placeholder="Escreva livremente..."
                  className="min-h-[60vh] rounded-xl border border-border bg-surface px-5 py-4 font-[family-name:var(--font-literata)] text-[15px] leading-7 ring-accent focus:ring-2"
                  ariaLabel="Conteúdo da página"
                />
              </div>
            )}
          </main>

          <aside className="min-h-0 shrink-0 border-t border-border/70 px-4 py-3 lg:w-56 lg:border-l lg:border-t-0 lg:px-3">
            <MarksPanel marks={marks} onJump={handleJumpToMark} onDelete={(id) => void handleDeleteMark(id)} />
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.type === "notebook" ? "Excluir caderno" : "Excluir página"}
        description={
          deleteTarget
            ? `Excluir "${deleteTarget.label}"? Essa ação não pode ser desfeita.`
            : ""
        }
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
