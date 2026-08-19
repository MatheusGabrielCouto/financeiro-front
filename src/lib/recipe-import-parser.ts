import type { CreateRecipeBody, RecipeDifficulty, RecipeIngredientInput, RecipeStepInput } from "@/lib/types"

export type ParsedRecipeImport = {
  title: string
  description: string
  categoryName: string | null
  servings: number | null
  prepMinutes: number | null
  cookMinutes: number | null
  difficulty: RecipeDifficulty | null
  ingredients: RecipeIngredientInput[]
  steps: RecipeStepInput[]
  lineNumber: number
  sourceLabel: string
  warnings: string[]
}

export type RecipeImportFormat = "text" | "json"

export type RecipeImportParseResult = {
  recipes: ParsedRecipeImport[]
  errors: string[]
  defaultCategoryName: string | null
}

const META_KEYS = {
  categoria: "category",
  category: "category",
  descrição: "description",
  descricao: "description",
  description: "description",
  porções: "servings",
  porcoes: "servings",
  servings: "servings",
  preparo: "prep",
  prep: "prep",
  cozimento: "cook",
  cook: "cook",
  dificuldade: "difficulty",
  difficulty: "difficulty",
} as const

type MetaKey = (typeof META_KEYS)[keyof typeof META_KEYS]

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const parseMinutes = (value: string): number | null => {
  const match = value.match(/(\d+)/)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

const parseDifficulty = (value: string): RecipeDifficulty | null => {
  const normalized = normalizeKey(value)
  if (["facil", "easy", "f", "e"].includes(normalized)) return "EASY"
  if (["medio", "medium", "m"].includes(normalized)) return "MEDIUM"
  if (["dificil", "hard", "d", "h"].includes(normalized)) return "HARD"
  return null
}

const parseMetaLine = (line: string): { key: MetaKey; value: string } | null => {
  const match = line.match(/^([^:]+):\s*(.+)$/)
  if (!match) return null
  const key = META_KEYS[normalizeKey(match[1]) as keyof typeof META_KEYS]
  if (!key) return null
  return { key, value: match[2].trim() }
}

const isSectionHeader = (line: string): "ingredients" | "steps" | null => {
  const trimmed = line.trim()
  if (/^#{1,3}\s*ingredientes\s*$/i.test(trimmed)) return "ingredients"
  if (/^#{1,3}\s*(passos|modo de preparo)\s*$/i.test(trimmed)) return "steps"
  if (/^\[(ingredientes|passos)\]$/i.test(trimmed)) {
    return /passos/i.test(trimmed) ? "steps" : "ingredients"
  }
  if (/^ingredientes\s*:?\s*$/i.test(trimmed)) return "ingredients"
  if (/^(passos|modo de preparo)\s*:?\s*$/i.test(trimmed)) return "steps"
  return null
}

const isTitleLine = (line: string) => /^#\s+[^#]/.test(line.trim())

const parseTitle = (line: string) => line.trim().replace(/^#\s+/, "").trim()

const parseIngredientLine = (line: string): RecipeIngredientInput | null => {
  const cleaned = line.replace(/^\s*[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim()
  if (!cleaned) return null

  let groupLabel: string | null = null
  let body = cleaned
  const groupMatch = body.match(/\s*\[([^\]]+)\]\s*$/)
  if (groupMatch) {
    groupLabel = groupMatch[1].trim()
    body = body.slice(0, groupMatch.index).trim()
  }

  const quantityUnitMatch = body.match(/^([\d.,]+)\s*([a-zA-Zà-ú%/]+)?\s+(.+)$/)
  if (quantityUnitMatch) {
    const [, quantity, unit, name] = quantityUnitMatch
    return {
      name: name.trim(),
      quantity: quantity.replace(",", "."),
      unit: unit?.trim() || null,
      groupLabel,
    }
  }

  return {
    name: body,
    quantity: null,
    unit: null,
    groupLabel,
  }
}

const parseStepLine = (line: string): RecipeStepInput | null => {
  let cleaned = line.replace(/^\s*[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim()
  if (!cleaned) return null

  let timerMinutes: number | null = null
  const timerMatch =
    cleaned.match(/\(\s*(\d+)\s*min(?:utos?)?\s*\)\s*$/i) ??
    cleaned.match(/\[\s*(\d+)\s*min(?:utos?)?\s*\]\s*$/i)

  if (timerMatch) {
    timerMinutes = Number(timerMatch[1])
    cleaned = cleaned.slice(0, timerMatch.index).trim()
  }

  return {
    instruction: cleaned,
    timerMinutes,
  }
}

const splitRecipeBlocks = (text: string) => {
  const blocks: { content: string; startLine: number }[] = []
  let current: string[] = []
  let startLine = 1

  text.split("\n").forEach((line, index) => {
    const lineNumber = index + 1
    if (/^\s*---+\s*$/.test(line) || /^\s*===+\s*$/.test(line)) {
      if (current.some((row) => row.trim())) {
        blocks.push({ content: current.join("\n"), startLine })
      }
      current = []
      startLine = lineNumber + 1
      return
    }
    current.push(line)
  })

  if (current.some((row) => row.trim())) {
    blocks.push({ content: current.join("\n"), startLine })
  }

  return blocks
}

const parseRecipeBlock = (
  block: string,
  startLine: number,
  inheritedCategory: string | null
): { recipe: ParsedRecipeImport | null; nextCategory: string | null; error?: string } => {
  let defaultCategory = inheritedCategory
  const lines = block.split("\n")
  let title = ""
  let description = ""
  let categoryName: string | null = inheritedCategory
  let servings: number | null = null
  let prepMinutes: number | null = null
  let cookMinutes: number | null = null
  let difficulty: RecipeDifficulty | null = null
  const ingredients: RecipeIngredientInput[] = []
  const steps: RecipeStepInput[] = []
  const warnings: string[] = []

  let mode: "meta" | "description" | "ingredients" | "steps" = "meta"
  let titleLineNumber = startLine

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index]
    const line = rawLine.trim()
    const lineNumber = startLine + index

    if (!line) {
      if (mode === "description" && description) {
        description += "\n"
      }
      continue
    }

    if (/^@\s+/.test(line)) {
      const name = line.replace(/^@\s+/, "").trim()
      if (name) {
        defaultCategory = name
        if (!title) categoryName = name
      }
      continue
    }

    if (!title && isTitleLine(line)) {
      title = parseTitle(line)
      titleLineNumber = lineNumber
      mode = "description"
      continue
    }

    const section = isSectionHeader(line)
    if (section) {
      mode = section
      continue
    }

    const meta = parseMetaLine(line)
    if (meta && (!title || mode !== "description")) {
      mode = "meta"
      if (meta.key === "category") categoryName = meta.value
      if (meta.key === "description") description = meta.value
      if (meta.key === "servings") servings = parseMinutes(meta.value)
      if (meta.key === "prep") prepMinutes = parseMinutes(meta.value)
      if (meta.key === "cook") cookMinutes = parseMinutes(meta.value)
      if (meta.key === "difficulty") {
        difficulty = parseDifficulty(meta.value)
        if (!difficulty) {
          warnings.push(`Dificuldade não reconhecida na linha ${lineNumber}`)
        }
      }
      continue
    }

    if (!title) {
      return {
        recipe: null,
        nextCategory: defaultCategory,
        error: `Linha ${lineNumber}: receita sem título (# Nome da receita)`,
      }
    }

    if (mode === "description") {
      const maybeMeta = parseMetaLine(line)
      if (maybeMeta) {
        mode = "meta"
        index -= 1
        continue
      }
      description = description ? `${description}\n${line}` : line
      continue
    }

    if (mode === "ingredients") {
      const ingredient = parseIngredientLine(line)
      if (ingredient) {
        ingredients.push({ ...ingredient, sortOrder: ingredients.length })
      }
      continue
    }

    if (mode === "steps") {
      const step = parseStepLine(line)
      if (step) {
        steps.push({ ...step, sortOrder: steps.length })
      }
      continue
    }

    const maybeMetaAfterTitle = parseMetaLine(line)
    if (maybeMetaAfterTitle) {
      if (maybeMetaAfterTitle.key === "category") categoryName = maybeMetaAfterTitle.value
      if (maybeMetaAfterTitle.key === "description") description = maybeMetaAfterTitle.value
      if (maybeMetaAfterTitle.key === "servings") servings = parseMinutes(maybeMetaAfterTitle.value)
      if (maybeMetaAfterTitle.key === "prep") prepMinutes = parseMinutes(maybeMetaAfterTitle.value)
      if (maybeMetaAfterTitle.key === "cook") cookMinutes = parseMinutes(maybeMetaAfterTitle.value)
      if (maybeMetaAfterTitle.key === "difficulty") {
        difficulty = parseDifficulty(maybeMetaAfterTitle.value)
      }
      mode = "meta"
    }
  }

  if (!title) {
    return {
      recipe: null,
      nextCategory: defaultCategory,
      error: `Linha ${startLine}: bloco sem título`,
    }
  }

  if (ingredients.length === 0) {
    warnings.push("Nenhum ingrediente encontrado")
  }

  if (steps.length === 0) {
    warnings.push("Nenhum passo encontrado")
  }

  return {
    recipe: {
      title,
      description: description.trim(),
      categoryName,
      servings,
      prepMinutes,
      cookMinutes,
      difficulty,
      ingredients,
      steps,
      lineNumber: titleLineNumber,
      sourceLabel: `Linha ${titleLineNumber}`,
      warnings,
    },
    nextCategory: defaultCategory,
  }
}

export const parseRecipeImportText = (text: string): RecipeImportParseResult => {
  const trimmed = text.trim()
  if (!trimmed) {
    return { recipes: [], errors: [], defaultCategoryName: null }
  }

  const blocks = splitRecipeBlocks(trimmed)
  const recipes: ParsedRecipeImport[] = []
  const errors: string[] = []
  let inheritedCategory: string | null = null
  let fileCategory: string | null = null

  const firstAt = trimmed
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^@\s+/.test(line))

  if (firstAt) {
    fileCategory = firstAt.replace(/^@\s+/, "").trim() || null
    inheritedCategory = fileCategory
  }

  blocks.forEach(({ content, startLine }) => {
    const result = parseRecipeBlock(content, startLine, inheritedCategory)
    if (result.error) {
      errors.push(result.error)
      return
    }
    if (result.recipe) {
      recipes.push(result.recipe)
    }
    inheritedCategory = result.nextCategory
  })

  return {
    recipes,
    errors,
    defaultCategoryName: fileCategory,
  }
}

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") return parseMinutes(value)
  return null
}

const readRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

const pickField = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (key in record) return record[key]
  }
  return undefined
}

const parseJsonIngredient = (
  value: unknown,
  index: number
): RecipeIngredientInput | null => {
  if (typeof value === "string") {
    const parsed = parseIngredientLine(value)
    return parsed ? { ...parsed, sortOrder: index } : null
  }

  const record = readRecord(value)
  if (!record) return null

  const name = readString(pickField(record, ["name", "nome", "ingredient", "ingrediente"]))
  if (!name) return null

  return {
    name,
    quantity: readString(pickField(record, ["quantity", "quantidade", "qtd"])) ?? null,
    unit: readString(pickField(record, ["unit", "unidade"])) ?? null,
    groupLabel:
      readString(pickField(record, ["groupLabel", "grupo", "group", "groupName"])) ?? null,
    sortOrder: index,
  }
}

const parseJsonStep = (value: unknown, index: number): RecipeStepInput | null => {
  if (typeof value === "string") {
    const parsed = parseStepLine(value)
    return parsed ? { ...parsed, sortOrder: index } : null
  }

  const record = readRecord(value)
  if (!record) return null

  const instruction = readString(
    pickField(record, ["instruction", "instrucao", "text", "texto", "step", "passo"])
  )
  if (!instruction) return null

  return {
    instruction,
    timerMinutes: readNumber(pickField(record, ["timerMinutes", "timer", "tempo"])),
    sortOrder: index,
  }
}

const parseJsonDifficulty = (value: unknown): RecipeDifficulty | null => {
  if (typeof value === "string") return parseDifficulty(value)
  return null
}

const parseJsonRecipe = (
  value: unknown,
  index: number,
  inheritedCategory: string | null
): { recipe: ParsedRecipeImport | null; error?: string } => {
  const record = readRecord(value)
  if (!record) {
    return { recipe: null, error: `Item ${index + 1}: receita inválida` }
  }

  const title = readString(pickField(record, ["title", "titulo", "name", "nome"]))
  if (!title) {
    return { recipe: null, error: `Item ${index + 1}: campo "title" é obrigatório` }
  }

  const categoryName =
    readString(pickField(record, ["category", "categoria", "categoryName", "coleção", "colecao"])) ??
    inheritedCategory

  const ingredientsRaw = pickField(record, ["ingredients", "ingredientes"])
  const stepsRaw = pickField(record, ["steps", "passos", "instructions", "modoPreparo"])

  const ingredients = Array.isArray(ingredientsRaw)
    ? ingredientsRaw
        .map((item, ingredientIndex) => parseJsonIngredient(item, ingredientIndex))
        .filter((item): item is RecipeIngredientInput => item !== null)
    : []

  const steps = Array.isArray(stepsRaw)
    ? stepsRaw
        .map((item, stepIndex) => parseJsonStep(item, stepIndex))
        .filter((item): item is RecipeStepInput => item !== null)
    : []

  const warnings: string[] = []
  if (ingredients.length === 0) warnings.push("Nenhum ingrediente encontrado")
  if (steps.length === 0) warnings.push("Nenhum passo encontrado")

  const difficultyValue = pickField(record, ["difficulty", "dificuldade"])
  const difficulty = difficultyValue ? parseJsonDifficulty(difficultyValue) : null
  if (difficultyValue && !difficulty) {
    warnings.push("Dificuldade não reconhecida")
  }

  return {
    recipe: {
      title,
      description: readString(pickField(record, ["description", "descricao"])) ?? "",
      categoryName,
      servings: readNumber(pickField(record, ["servings", "porcoes", "porções"])),
      prepMinutes: readNumber(
        pickField(record, ["prepMinutes", "preparo", "prep", "tempoPreparo"])
      ),
      cookMinutes: readNumber(
        pickField(record, ["cookMinutes", "cozimento", "cook", "tempoCozimento"])
      ),
      difficulty,
      ingredients,
      steps,
      lineNumber: index + 1,
      sourceLabel: `Item ${index + 1}`,
      warnings,
    },
  }
}

export const parseRecipeImportJson = (text: string): RecipeImportParseResult => {
  const trimmed = text.trim()
  if (!trimmed) {
    return { recipes: [], errors: [], defaultCategoryName: null }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return {
      recipes: [],
      errors: ["JSON inválido — verifique vírgulas, aspas e chaves"],
      defaultCategoryName: null,
    }
  }

  let defaultCategoryName: string | null = null
  let items: unknown[] = []

  if (Array.isArray(parsed)) {
    items = parsed
  } else {
    const root = readRecord(parsed)
    if (!root) {
      return {
        recipes: [],
        errors: ["JSON deve ser um array de receitas ou um objeto com campo \"recipes\""],
        defaultCategoryName: null,
      }
    }

    defaultCategoryName =
      readString(pickField(root, ["category", "categoria", "defaultCategory"])) ?? null

    const recipesField = pickField(root, ["recipes", "receitas", "items", "data"])
    if (!Array.isArray(recipesField)) {
      return {
        recipes: [],
        errors: ["Objeto raiz precisa do array \"recipes\" ou \"receitas\""],
        defaultCategoryName,
      }
    }

    items = recipesField
  }

  const recipes: ParsedRecipeImport[] = []
  const errors: string[] = []

  items.forEach((item, index) => {
    const result = parseJsonRecipe(item, index, defaultCategoryName)
    if (result.error) {
      errors.push(result.error)
      return
    }
    if (result.recipe) recipes.push(result.recipe)
  })

  return {
    recipes,
    errors,
    defaultCategoryName,
  }
}

export const parseRecipeImport = (
  text: string,
  format: RecipeImportFormat
): RecipeImportParseResult => {
  if (format === "json") return parseRecipeImportJson(text)
  return parseRecipeImportText(text)
}

export const toCreateRecipeBody = (
  recipe: ParsedRecipeImport,
  categoryId: string | null
): CreateRecipeBody => ({
  title: recipe.title,
  description: recipe.description,
  servings: recipe.servings,
  prepMinutes: recipe.prepMinutes,
  cookMinutes: recipe.cookMinutes,
  difficulty: recipe.difficulty,
  categoryId,
  ingredients: recipe.ingredients,
  steps: recipe.steps,
})

export const RECIPE_IMPORT_TEMPLATE = `@ Cappuccinos quentes

# Cappuccino clássico
Descrição: Clássico equilibrado com microespuma sedosa.
Porções: 1
Preparo: 5 min
Dificuldade: fácil

## Ingredientes
- 18 g café em grãos [Base de espresso]
- 36 g espresso [Base de espresso]
- 120 ml leite integral gelado

## Passos
1. Extraia 36 g de espresso a partir de 18 g de café.
2. Vaporize o leite até 55–65 °C (5 min)
3. Despeje o leite no espresso, mantendo microespuma.

---

# Mocha cremoso
Categoria: Mocaccinos
Porções: 1
Preparo: 6 min
Dificuldade: fácil

## Ingredientes
- 18 g café em grãos
- 120 ml leite
- 18 g chocolate 50–60%

## Passos
1. Derreta o chocolate com um pouco de espresso.
2. Complete com leite vaporizado.`

export const RECIPE_IMPORT_JSON_TEMPLATE = `{
  "category": "Cappuccinos quentes",
  "recipes": [
    {
      "title": "Cappuccino clássico",
      "description": "Clássico equilibrado com microespuma sedosa.",
      "servings": 1,
      "prepMinutes": 5,
      "difficulty": "EASY",
      "ingredients": [
        { "name": "café em grãos", "quantity": "18", "unit": "g", "groupLabel": "Base de espresso" },
        { "name": "leite integral gelado", "quantity": "120", "unit": "ml" }
      ],
      "steps": [
        { "instruction": "Extraia 36 g de espresso a partir de 18 g de café." },
        { "instruction": "Vaporize o leite até 55–65 °C.", "timerMinutes": 5 }
      ]
    },
    {
      "title": "Mocha cremoso",
      "category": "Mocaccinos",
      "servings": 1,
      "prepMinutes": 6,
      "difficulty": "fácil",
      "ingredients": [
        "18 g café em grãos",
        "120 ml leite",
        "18 g chocolate 50–60%"
      ],
      "steps": [
        "Derreta o chocolate com um pouco de espresso.",
        "Complete com leite vaporizado."
      ]
    }
  ]
}`
