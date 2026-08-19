import type { RecipeCategory, RecipeListItem } from "@/lib/types"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"
import { RecipeCard } from "@/components/receitas/recipe-card"

type RecipeGroupedListProps = {
  categories: RecipeCategory[]
  recipes: RecipeListItem[]
}

export const RecipeGroupedList = ({ categories, recipes }: RecipeGroupedListProps) => {
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
  const uncategorized = recipes.filter((recipe) => !recipe.categoryId)

  return (
    <div className="space-y-10">
      {sortedCategories.map((category) => {
        const categoryRecipes = recipes.filter((recipe) => recipe.categoryId === category.id)
        if (categoryRecipes.length === 0) return null

        const visual = getRecipeCategoryVisual(category.color)

        return (
          <section key={category.id} aria-labelledby={`recipe-section-${category.id}`}>
            <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${visual.label}`}>
                  Coleção
                </p>
                <h2
                  id={`recipe-section-${category.id}`}
                  className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight md:text-2xl"
                >
                  <span aria-hidden className="mr-2">
                    {category.emoji}
                  </span>
                  {category.name}
                </h2>
              </div>
              <p className="text-sm text-muted">
                {categoryRecipes.length} receita{categoryRecipes.length === 1 ? "" : "s"}
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categoryRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        )
      })}

      {uncategorized.length > 0 ? (
        <section aria-labelledby="recipe-section-uncategorized">
          <header className="mb-4">
            <h2
              id="recipe-section-uncategorized"
              className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
            >
              Sem categoria
            </h2>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {uncategorized.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
