import { redirect } from "next/navigation"
import { RecipeCookMode } from "@/components/receitas/recipe-cook-mode"
import { ApiError } from "@/lib/api-server"
import { getRecipe, getRecipeCookSession } from "@/lib/finance-api"

type PrepararReceitaPageProps = {
  params: Promise<{ id: string }>
}

const PrepararReceitaPage = async ({ params }: PrepararReceitaPageProps) => {
  const { id } = await params

  try {
    const [recipe, session] = await Promise.all([
      getRecipe(id),
      getRecipeCookSession(id),
    ])

    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <RecipeCookMode recipe={recipe} initialSession={session} />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    if (error instanceof ApiError && error.status === 404) {
      redirect("/pessoal/receitas")
    }
    throw error
  }
}

export default PrepararReceitaPage
