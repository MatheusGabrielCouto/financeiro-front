import type { RecipeIngredient } from "@/lib/types"
import { formatIngredientLine } from "@/lib/recipe-labels"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"

type RecipeIngredientsPanelProps = {
  ingredients: RecipeIngredient[]
  categoryColor?: string | null
}

type IngredientGroup = {
  label: string | null
  items: RecipeIngredient[]
}

const groupIngredients = (ingredients: RecipeIngredient[]): IngredientGroup[] => {
  const groups: IngredientGroup[] = []

  for (const item of ingredients) {
    const label = item.groupLabel?.trim() || null
    const last = groups[groups.length - 1]

    if (last && last.label === label) {
      last.items.push(item)
      continue
    }

    groups.push({ label, items: [item] })
  }

  return groups
}

export const RecipeIngredientsPanel = ({
  ingredients,
  categoryColor,
}: RecipeIngredientsPanelProps) => {
  const visual = getRecipeCategoryVisual(categoryColor ?? "violet")
  const groups = groupIngredients(ingredients)

  if (ingredients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted">Nenhum ingrediente cadastrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-surface p-5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Ingredientes
        </h2>
        <p className="mt-1 text-sm text-muted">
          {ingredients.length} item{ingredients.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((group, groupIndex) => (
          <div key={`${group.label ?? "default"}-${groupIndex}`}>
            {group.label ? (
              <p
                className={`mb-2 text-xs font-semibold uppercase tracking-[0.12em] ${visual.label}`}
              >
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                    aria-hidden
                  />
                  <span>{formatIngredientLine(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
