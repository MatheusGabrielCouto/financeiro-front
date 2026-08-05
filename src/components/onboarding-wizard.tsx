"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { CurrencyInput } from "@/components/currency-input"

type Step = "welcome" | "salary" | "bill" | "done"

const STEPS: Step[] = ["welcome", "salary", "bill", "done"]

const STEP_LABELS: Record<Step, string> = {
  welcome: "Boas-vindas",
  salary: "Salário",
  bill: "Conta fixa",
  done: "Pronto",
}

export const OnboardingWizard = ({ userName }: { userName: string }) => {
  const router = useRouter()
  const [step, setStep] = useState<Step>("welcome")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [salaryTitle, setSalaryTitle] = useState("Salário")
  const [salaryValue, setSalaryValue] = useState(0)
  const [salaryDay, setSalaryDay] = useState("5")

  const [billTitle, setBillTitle] = useState("")
  const [billValue, setBillValue] = useState(0)
  const [billDay, setBillDay] = useState("10")

  const firstName = userName.split(" ")[0] || userName
  const stepIndex = STEPS.indexOf(step) + 1

  const completeOnboarding = async () => {
    await fetch("/api/onboarding/complete", { method: "POST" })
    router.replace("/")
    router.refresh()
  }

  const handleSkip = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await completeOnboarding()
    } catch {
      setError("Não foi possível continuar")
      setIsLoading(false)
    }
  }

  const handleSaveSalary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (salaryValue <= 0) {
      setError("Informe o valor do salário")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/proxy/recurring-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: salaryTitle.trim() || "Salário",
          value: salaryValue,
          dayOfMonth: Number(salaryDay),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar o salário"
        )
        return
      }

      setStep("bill")
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!billTitle.trim() || billValue <= 0) {
      setError("Preencha o nome e o valor da conta")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/proxy/recurring-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: billTitle.trim(),
          value: billValue,
          dayOfMonth: Number(billDay),
          categoryId: null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar a conta fixa"
        )
        return
      }

      setStep("done")
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      await completeOnboarding()
    } catch {
      setError("Não foi possível concluir")
      setIsLoading(false)
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"

  return (
    <div className="w-full space-y-5 auth-enter">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/70">
          Passo {stepIndex} de {STEPS.length}
        </p>
        <p className="text-xs font-medium text-teal-50/80">
          {STEP_LABELS[step]}
        </p>
      </div>

      <div className="flex gap-2" role="list" aria-label="Progresso do onboarding">
        {STEPS.map((item, index) => {
          const active = index < stepIndex
          return (
            <div
              key={item}
              role="listitem"
              className={[
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                active ? "bg-teal-200" : "bg-white/15",
              ].join(" ")}
              aria-current={item === step ? "step" : undefined}
            />
          )
        })}
      </div>

      <div className="rounded-3xl border border-white/15 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] sm:p-8">
        {step === "welcome" ? (
          <div key="welcome" className="onboarding-step space-y-5">
            <div className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              Setup rápido
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900">
                Olá, {firstName}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Em poucos minutos você cadastra o salário e, se quiser, uma
                conta fixa. Depois o painel já nasce com previsibilidade.
              </p>
            </div>

            <ul className="space-y-2.5 rounded-2xl bg-slate-50 px-4 py-3.5 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="font-semibold text-accent">1.</span>
                Informar sua receita principal
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">2.</span>
                Adicionar uma conta fixa (opcional)
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">3.</span>
                Entrar no painel do mês
              </li>
            </ul>

            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep("salary")
                }}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:bg-accent-hover"
                aria-label="Começar onboarding"
              >
                Começar
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                aria-label="Pular onboarding"
              >
                {isLoading ? "Abrindo..." : "Pular por agora"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "salary" ? (
          <form
            key="salary"
            onSubmit={handleSaveSalary}
            className="onboarding-step space-y-5"
          >
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
                Seu salário
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Cadastre como receita fixa. Isso alimenta a sobra prevista e os
                insights do mês.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-800">Nome</span>
              <input
                required
                value={salaryTitle}
                onChange={(event) => setSalaryTitle(event.target.value)}
                className={inputClassName}
                aria-label="Nome da receita"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Valor</span>
                <CurrencyInput
                  required
                  value={salaryValue}
                  onValueChange={setSalaryValue}
                  ariaLabel="Valor do salário"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-800">
                  Dia do mês
                </span>
                <input
                  required
                  type="number"
                  min={1}
                  max={31}
                  value={salaryDay}
                  onChange={(event) => setSalaryDay(event.target.value)}
                  className={inputClassName}
                  aria-label="Dia do salário"
                />
              </label>
            </div>

            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
              >
                {isLoading ? "Salvando..." : "Continuar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep("bill")
                }}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
              >
                Pular salário
              </button>
            </div>
          </form>
        ) : null}

        {step === "bill" ? (
          <form
            key="bill"
            onSubmit={handleSaveBill}
            className="onboarding-step space-y-5"
          >
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
                Uma conta fixa
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Ex.: aluguel, internet ou academia. Você pode cadastrar mais
                depois em Contas fixas.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-800">
                Nome da conta
              </span>
              <input
                value={billTitle}
                onChange={(event) => setBillTitle(event.target.value)}
                placeholder="Ex.: Aluguel"
                className={inputClassName}
                aria-label="Nome da conta fixa"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Valor</span>
                <CurrencyInput
                  value={billValue}
                  onValueChange={setBillValue}
                  ariaLabel="Valor da conta fixa"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-800">
                  Dia do vencimento
                </span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={billDay}
                  onChange={(event) => setBillDay(event.target.value)}
                  className={inputClassName}
                  aria-label="Dia da conta fixa"
                />
              </label>
            </div>

            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
              >
                {isLoading ? "Salvando..." : "Salvar e concluir"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep("done")
                }}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
              >
                Pular conta
              </button>
            </div>
          </form>
        ) : null}

        {step === "done" ? (
          <div key="done" className="onboarding-step space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-bold text-accent">
              ✓
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
                Tudo pronto
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Você já pode acompanhar o mês, cadastrar dívidas, guardar nas
                caixinhas e ver insights.
              </p>
            </div>

            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleFinish}
              disabled={isLoading}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:bg-accent-hover disabled:opacity-60"
              aria-label="Ir para o início"
            >
              {isLoading ? "Abrindo..." : "Ir para o início"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
