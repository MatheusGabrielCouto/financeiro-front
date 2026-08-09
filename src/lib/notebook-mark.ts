export type WrapSelectionResult = {
  id: string
  snippet: string
}

export const wrapSelectionInMark = (editor: HTMLElement | null): WrapSelectionResult | null => {
  const selection = document.getSelection()
  if (!editor || !selection || selection.isCollapsed || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null

  const mark = document.createElement("mark")
  const id = crypto.randomUUID()
  mark.dataset.markId = id
  mark.className = "nb-mark"
  mark.appendChild(range.extractContents())
  range.insertNode(mark)

  selection.removeAllRanges()
  const collapsed = document.createRange()
  collapsed.selectNodeContents(mark)
  collapsed.collapse(false)
  selection.addRange(collapsed)

  return { id, snippet: (mark.textContent ?? "").trim().slice(0, 140) }
}

export const unwrapMark = (editor: HTMLElement | null, markId: string) => {
  const mark = editor?.querySelector<HTMLElement>(`[data-mark-id="${markId}"]`)
  if (!mark || !mark.parentNode) return
  while (mark.firstChild) {
    mark.parentNode.insertBefore(mark.firstChild, mark)
  }
  mark.parentNode.removeChild(mark)
}

export const flashMark = (editor: HTMLElement | null, markId: string) => {
  const mark = editor?.querySelector<HTMLElement>(`[data-mark-id="${markId}"]`)
  if (!mark) return
  mark.scrollIntoView({ behavior: "smooth", block: "center" })
  mark.classList.add("nb-mark-flash")
  window.setTimeout(() => mark.classList.remove("nb-mark-flash"), 900)
}
