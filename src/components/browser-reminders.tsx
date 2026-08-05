"use client"

import { useEffect, useMemo, useState } from "react"
import type { DueAlert } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format"
import { urgencyLabel } from "@/lib/due-alerts"

const STORAGE_KEY = "browser-reminders-enabled"
const LAST_SHOWN_KEY = "browser-reminders-last-shown"

type BrowserRemindersProps = {
  alerts: DueAlert[]
  showTestButton?: boolean
}

type MessageTone = "info" | "success" | "danger"

const permissionLabel = (
  permission: NotificationPermission | "unsupported"
) => {
  if (permission === "granted") return "Permitido"
  if (permission === "denied") return "Bloqueado"
  if (permission === "default") return "Ainda não definido"
  return "Não suportado"
}

const ensureNotificationServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null

  const registration = await navigator.serviceWorker.register(
    "/notification-sw.js",
    { scope: "/" }
  )
  await navigator.serviceWorker.ready
  return registration
}

const showBrowserNotification = async (
  title: string,
  options: NotificationOptions
) => {
  try {
    const registration = await ensureNotificationServiceWorker()
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        ...options,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      })
      return "service-worker" as const
    }
  } catch {
    // fallback below
  }

  const notification = new Notification(title, options)
  return new Promise<"notification-api">((resolve, reject) => {
    notification.onshow = () => resolve("notification-api")
    notification.onerror = () =>
      reject(new Error("O navegador bloqueou a exibição da notificação"))
    window.setTimeout(() => resolve("notification-api"), 400)
  })
}

export const BrowserReminders = ({
  alerts,
  showTestButton = false,
}: BrowserRemindersProps) => {
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default")
  const [isSecure, setIsSecure] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<MessageTone>("info")
  const [inAppPreview, setInAppPreview] = useState<{
    title: string
    body: string
  } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const priorityAlerts = useMemo(
    () =>
      alerts.filter(
        (item) =>
          item.urgency === "overdue" ||
          item.urgency === "today" ||
          item.urgency === "tomorrow"
      ),
    [alerts]
  )

  const setStatus = (text: string, tone: MessageTone = "info") => {
    setMessage(text)
    setMessageTone(tone)
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    setIsSecure(window.isSecureContext)

    if (!("Notification" in window)) {
      setPermission("unsupported")
      return
    }

    setPermission(Notification.permission)
    setEnabled(localStorage.getItem(STORAGE_KEY) === "1")
  }, [])

  useEffect(() => {
    if (!enabled || permission !== "granted" || priorityAlerts.length === 0) {
      return
    }

    const todayKey = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(LAST_SHOWN_KEY) === todayKey) return

    const overdue = priorityAlerts.filter((item) => item.urgency === "overdue").length
    const today = priorityAlerts.filter((item) => item.urgency === "today").length
    const tomorrow = priorityAlerts.filter(
      (item) => item.urgency === "tomorrow"
    ).length
    const total = priorityAlerts.reduce((sum, item) => sum + item.value, 0)

    const parts = [
      overdue ? `${overdue} atrasado(s)` : null,
      today ? `${today} para hoje` : null,
      tomorrow ? `${tomorrow} para amanhã` : null,
    ].filter(Boolean)

    const title = "Lembretes financeiros"
    const body = `${parts.join(" · ")}. Total: ${formatCurrency(total)}`

    void showBrowserNotification(title, {
      body,
      tag: `financeiro-reminders-${todayKey}`,
      data: { url: "/notificacoes" },
    })
      .then(() => {
        localStorage.setItem(LAST_SHOWN_KEY, todayKey)
      })
      .catch(() => {
        // ignore auto reminder failures
      })
  }, [enabled, permission, priorityAlerts])

  const handleEnable = async () => {
    setMessage(null)
    setInAppPreview(null)

    if (!window.isSecureContext) {
      setStatus(
        "Notificações exigem HTTPS ou localhost. Abra o app em http://localhost.",
        "danger"
      )
      return
    }

    if (!("Notification" in window)) {
      setStatus("Este navegador não suporta notificações.", "danger")
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result !== "granted") {
      setStatus(
        "Permissão negada. No Chrome: cadeado ao lado da URL → Notificações → Permitir. No Mac, confira também Ajustes do Sistema → Notificações → Chrome.",
        "danger"
      )
      setEnabled(false)
      localStorage.setItem(STORAGE_KEY, "0")
      return
    }

    try {
      await ensureNotificationServiceWorker()
    } catch {
      // optional
    }

    setEnabled(true)
    localStorage.setItem(STORAGE_KEY, "1")
    localStorage.removeItem(LAST_SHOWN_KEY)
    setStatus(
      "Lembretes ativados. Use “Testar notificação” para validar o navegador.",
      "success"
    )
  }

  const handleDisable = () => {
    setEnabled(false)
    localStorage.setItem(STORAGE_KEY, "0")
    setInAppPreview(null)
    setStatus("Lembretes do navegador desativados.", "info")
  }

  const handleTestNotification = async () => {
    setMessage(null)
    setInAppPreview(null)
    setIsTesting(true)

    const title = "Financeiro — teste"
    const body =
      "Notificação de teste enviada com sucesso. Seus lembretes estão funcionando."

    const results: string[] = []

    try {
      if (!window.isSecureContext) {
        setStatus(
          "Contexto inseguro. Use http://localhost:... (não o IP da rede em HTTP).",
          "danger"
        )
        return
      }

      if (!("Notification" in window)) {
        setStatus("Este navegador não suporta notificações.", "danger")
        return
      }

      let currentPermission = Notification.permission
      if (currentPermission !== "granted") {
        currentPermission = await Notification.requestPermission()
        setPermission(currentPermission)
      }

      if (currentPermission !== "granted") {
        setStatus(
          currentPermission === "denied"
            ? "Notificações bloqueadas para este site. Clique no cadeado na barra de endereço e permita Notificações; depois recarregue a página."
            : "Permissão não concedida. Aceite o pedido do navegador e tente de novo.",
          "danger"
        )
        return
      }

      setEnabled(true)
      localStorage.setItem(STORAGE_KEY, "1")

      setInAppPreview({ title, body })

      await showBrowserNotification(title, {
        body,
        tag: `financeiro-test-${Date.now()}`,
        requireInteraction: true,
        silent: false,
        data: { url: "/perfil" },
      })
      results.push("navegador OK")

      try {
        const response = await fetch("/api/proxy/notifications/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body }),
        })
        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          const tokenCount =
            typeof data.tokens === "number" ? data.tokens : 0
          results.push(
            tokenCount > 0
              ? `mobile OK (${tokenCount} dispositivo${tokenCount === 1 ? "" : "s"})`
              : "mobile OK"
          )
        } else if (response.status === 404) {
          results.push(
            "mobile: nenhum aparelho registrado (abra o app, ative notificações e mantenha a sessão)"
          )
        } else {
          results.push(
            typeof data.message === "string"
              ? `mobile: ${data.message}`
              : "mobile: falhou ao enviar push"
          )
        }
      } catch {
        results.push("mobile: erro de conexão com a API")
      }

      const hasMobileFail = results.some(
        (item) => item.includes("mobile:") && !item.includes("mobile OK")
      )

      setStatus(
        `Teste concluído — ${results.join(" · ")}.${
          hasMobileFail
            ? ""
            : " Se o banner do Mac não apareceu, confira Ajustes → Notificações e Foco."
        }`,
        hasMobileFail ? "info" : "success"
      )
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Não foi possível disparar a notificação de teste.",
        "danger"
      )
    } finally {
      setIsTesting(false)
    }
  }

  if (permission === "unsupported") {
    return (
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
        <h2 className="text-base font-semibold">Notificações no navegador</h2>
        <p className="mt-1 text-sm text-muted">
          Seu navegador não suporta notificações locais.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40">
      <h2 className="text-base font-semibold">Notificações no navegador</h2>
      <p className="mt-1 text-sm text-muted">
        Ative os lembretes locais para ser avisado ao abrir o app quando houver
        contas vencendo hoje, amanhã ou atrasadas.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
          Permissão: {permissionLabel(permission)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
          Contexto: {isSecure ? "seguro" : "inseguro"}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted">
        O teste dispara no navegador e também envia push Expo para o app mobile
        (se o dispositivo já tiver token registrado).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!enabled ? (
          <button
            type="button"
            onClick={handleEnable}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            aria-label="Ativar lembretes"
          >
            Ativar lembretes
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisable}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
            aria-label="Desativar lembretes"
          >
            Desativar lembretes
          </button>
        )}

        {showTestButton ? (
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={isTesting}
            className="rounded-xl border border-accent/30 bg-accent-soft/50 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent-soft disabled:opacity-60"
            aria-label="Disparar notificação de teste"
          >
            {isTesting ? "Enviando..." : "Testar notificação"}
          </button>
        ) : null}
      </div>

      {enabled ? (
        <p className="mt-3 text-xs font-medium text-success">
          Ativo · {priorityAlerts.length} alerta(s) prioritário(s) agora
        </p>
      ) : null}

      {inAppPreview ? (
        <div
          className="mt-4 rounded-2xl border border-accent/20 bg-[linear-gradient(135deg,#0b3d3a_0%,#0f766e_100%)] p-4 text-white shadow-md"
          role="status"
          aria-live="polite"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100/80">
            Prévia na página
          </p>
          <p className="mt-1 text-sm font-semibold">{inAppPreview.title}</p>
          <p className="mt-1 text-xs text-teal-50/85">{inAppPreview.body}</p>
        </div>
      ) : null}

      {message ? (
        <p
          className={`mt-3 text-sm ${
            messageTone === "danger"
              ? "text-danger"
              : messageTone === "success"
                ? "text-success"
                : "text-muted"
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      {priorityAlerts.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {priorityAlerts.slice(0, 3).map((alert) => (
            <li
              key={alert.id}
              className="rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-xs text-muted"
            >
              <span className="font-semibold text-foreground">{alert.title}</span>
              {" · "}
              {urgencyLabel(alert.urgency)} · {formatCurrency(alert.value)} ·{" "}
              {formatDate(alert.dueDate)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
