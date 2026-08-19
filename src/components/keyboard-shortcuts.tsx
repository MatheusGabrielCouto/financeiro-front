"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}

export const KeyboardShortcuts = () => {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      if (event.key === "n" || event.key === "N") {
        event.preventDefault()
        window.dispatchEvent(
          new CustomEvent("financeiro:quick-transaction", {
            detail: { mode: "DEBIT" },
          })
        )
        return
      }

      if (event.key === "/") {
        event.preventDefault()
        if (pathname.startsWith("/financeiro/extrato")) {
          window.dispatchEvent(new CustomEvent("financeiro:focus-extrato-search"))
          return
        }
        router.push("/financeiro/extrato?focus=search")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [pathname, router])

  return null
}
