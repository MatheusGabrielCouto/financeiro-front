"use client"

import { type RefObject } from "react"

type RichTextEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>
  content: string
  onChangeHtml?: (html: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export const RichTextEditor = ({
  editorRef,
  content,
  onChangeHtml,
  placeholder = "Escreva livremente...",
  className = "",
  ariaLabel = "Conteúdo",
}: RichTextEditorProps) => {
  const handleFocus = () => {
    document.execCommand("defaultParagraphSeparator", false, "p")
  }

  const handleInput = () => {
    onChangeHtml?.(editorRef.current?.innerHTML ?? "")
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onInput={handleInput}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: content }}
      className={`prose-journal outline-none ${className}`}
      aria-label={ariaLabel}
      role="textbox"
      aria-multiline="true"
    />
  )
}
