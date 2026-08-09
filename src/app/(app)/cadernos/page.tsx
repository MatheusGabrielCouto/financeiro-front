import { Fraunces, Literata } from "next/font/google"
import { redirect } from "next/navigation"
import { CadernosApp } from "@/components/cadernos/cadernos-app"
import { ApiError } from "@/lib/api-server"
import { getNotebook, getNotebookPage, getNotebooks } from "@/lib/finance-api"
import type { NotebookPage, NotebookWithPages } from "@/lib/types"

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
})

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
})

type CadernosPageProps = {
  searchParams: Promise<{
    notebook?: string
    page?: string
  }>
}

const CadernosPage = async ({ searchParams }: CadernosPageProps) => {
  const params = await searchParams

  try {
    const notebooks = await getNotebooks()

    const notebookId =
      params.notebook && notebooks.some((n) => n.id === params.notebook)
        ? params.notebook
        : notebooks[0]?.id

    let activeNotebook: NotebookWithPages | null = null
    let activePage: NotebookPage | null = null

    if (notebookId) {
      activeNotebook = await getNotebook(notebookId)

      const pageId =
        params.page && activeNotebook.pages.some((p) => p.id === params.page)
          ? params.page
          : activeNotebook.pages[0]?.id

      if (pageId) {
        activePage = await getNotebookPage(notebookId, pageId)
      }
    }

    return (
      <div className={`${fraunces.variable} ${literata.variable} flex min-h-0 flex-1 flex-col`}>
        <CadernosApp
          initialNotebooks={notebooks}
          initialNotebook={activeNotebook}
          initialPage={activePage}
        />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default CadernosPage
