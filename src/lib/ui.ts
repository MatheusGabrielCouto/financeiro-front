export const flattenCategories = <
  T extends { id: string; title: string; children?: T[] }
>(
  categories: T[]
) => {
  const result: Array<{ id: string; title: string; depth: number }> = []

  const walk = (items: T[], depth: number) => {
    for (const item of items) {
      result.push({ id: item.id, title: item.title, depth })
      if (item.children?.length) {
        walk(item.children, depth + 1)
      }
    }
  }

  walk(categories, 0)
  return result
}

export const transactionTypeLabel = (type: "DEBIT" | "CREDIT" | "PAY") => {
  if (type === "CREDIT") return "Entrada"
  if (type === "PAY") return "Pagamento"
  return "Saída"
}
