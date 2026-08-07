"use client"

import { FormEvent, useId, useState } from "react"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CurrencyInput } from "@/components/currency-input"
import { OverdueInterestHint } from "@/components/overdue-interest-hint"
import { StatusBadge } from "@/components/status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Installment, InterestRateType } from "@/lib/types"

type ManageDebtInstallmentsProps = {
  debtId: string
  installments: Installment[]
  interestRate: number
  interestRateType?: InterestRateType
}

const toDateInputValue = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseProxyError = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}))
  if (typeof data.message === "string") return data.message
  if (Array.isArray(data.message) && typeof data.message[0] === "string") {
    return data.message[0]
  }
  return fallback
}

export const ManageDebtInstallments = ({
  debtId,
  installments,
  interestRate,
  interestRateType,
}: ManageDebtInstallmentsProps) => {
  const router = useRouter()
  const addValueId = useId()
  const addDateId = useId()

  const sorted = [...installments].sort((a, b) => a.order - b.order)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(0)
  const [editDate, setEditDate] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditLoading, setIsEditLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Installment | null>(null)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [newValue, setNewValue] = useState(0)
  const [newDate, setNewDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  )
  const [addError, setAddError] = useState<string | null>(null)
  const [isAddLoading, setIsAddLoading] = useState(false)

  const handleStartEdit = (installment: Installment) => {
    setEditingId(installment.id)
    setEditValue(installment.value)
    setEditDate(toDateInputValue(installment.dateTransaction))
    setEditError(null)
  }

  const handleCancelEdit = () => {
    if (isEditLoading) return
    setEditingId(null)
    setEditError(null)
  }

  const handleSaveEdit = async (installmentId: string) => {
    if (editValue <= 0) {
      setEditError("Informe um valor maior que zero")
      return
    }
    if (!editDate) {
      setEditError("Informe a data de vencimento")
      return
    }

    setIsEditLoading(true)
    setEditError(null)

    try {
      const response = await fetch(`/api/proxy/installment/${installmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editValue, date: editDate }),
      })

      if (!response.ok) {
        setEditError(
          await parseProxyError(
            response,
            "Não foi possível atualizar a parcela"
          )
        )
        return
      }

      setEditingId(null)
      router.refresh()
    } catch {
      setEditError("Erro de conexão ao atualizar a parcela")
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleteLoading(true)
    setDeleteError(null)

    try {
      const response = await fetch(
        `/api/proxy/installment/${deleteTarget.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        setDeleteError(
          await parseProxyError(
            response,
            "Não foi possível remover a parcela"
          )
        )
        return
      }

      setDeleteTarget(null)
      router.refresh()
    } catch {
      setDeleteError("Erro de conexão ao remover a parcela")
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleAddInstallment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newValue <= 0) {
      setAddError("Informe um valor maior que zero")
      return
    }
    if (!newDate) {
      setAddError("Informe a data de vencimento")
      return
    }

    setIsAddLoading(true)
    setAddError(null)

    try {
      const response = await fetch("/api/proxy/installment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debtId,
          value: newValue,
          date: newDate,
        }),
      })

      if (!response.ok) {
        setAddError(
          await parseProxyError(response, "Não foi possível adicionar a parcela")
        )
        return
      }

      setNewValue(0)
      setNewDate(new Date().toISOString().slice(0, 10))
      router.refresh()
    } catch {
      setAddError("Erro de conexão ao adicionar a parcela")
    } finally {
      setIsAddLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">Parcelas</h2>
        <p className="text-sm text-muted">
          Edite valor e vencimento das parcelas em aberto, ou adicione novas.
        </p>
      </div>

      <div className="overflow-x-auto p-2 md:p-3">
        {sorted.length === 0 ? (
          <div className="rounded-xl bg-background px-4 py-10 text-center">
            <p className="font-semibold">Nenhuma parcela cadastrada</p>
            <p className="mt-1 text-sm text-muted">
              Adicione a primeira parcela no formulário abaixo.
            </p>
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">Vencimento</th>
                <th className="px-3 py-2.5 font-medium">Valor</th>
                <th className="px-3 py-2.5 font-medium">Situação</th>
                <th className="px-3 py-2.5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((installment) => {
                const isPaid = installment.status === "PAY"
                const isEditing = editingId === installment.id

                return (
                  <tr
                    key={installment.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-3 py-3 font-medium">{installment.order}</td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(event) => setEditDate(event.target.value)}
                          disabled={isEditLoading}
                          className="w-full min-w-[9.5rem] rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none ring-accent focus:ring-2"
                          aria-label={`Nova data da parcela ${installment.order}`}
                        />
                      ) : (
                        <span className="text-muted">
                          {formatDate(installment.dateTransaction)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums">
                      {isEditing ? (
                        <CurrencyInput
                          value={editValue}
                          onValueChange={setEditValue}
                          disabled={isEditLoading}
                          ariaLabel={`Novo valor da parcela ${installment.order}`}
                          className="w-full min-w-[8rem] rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none ring-accent focus:ring-2"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          {formatCurrency(installment.value)}
                          <OverdueInterestHint
                            value={installment.value}
                            dueDate={installment.dateTransaction}
                            interestRate={interestRate}
                            interestRateType={interestRateType}
                            status={installment.status}
                          />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={installment.status} />
                    </td>
                    <td className="px-3 py-3">
                      {isPaid ? (
                        <span className="text-xs text-muted">—</span>
                      ) : isEditing ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(installment.id)}
                              disabled={isEditLoading}
                              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
                              aria-label={`Salvar parcela ${installment.order}`}
                            >
                              {isEditLoading ? "Salvando..." : "Salvar"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isEditLoading}
                              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 disabled:opacity-60"
                              aria-label={`Cancelar edição da parcela ${installment.order}`}
                            >
                              Cancelar
                            </button>
                          </div>
                          {editError ? (
                            <p className="text-xs text-danger" role="alert">
                              {editError}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(installment)}
                            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50"
                            aria-label={`Editar parcela ${installment.order}`}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteTarget(installment)
                            }}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            aria-label={`Remover parcela ${installment.order}`}
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        <h3 className="text-sm font-semibold">Adicionar parcela</h3>
        <p className="mt-0.5 text-xs text-muted">
          A nova parcela entra como pendente no final da lista.
        </p>

        <form
          onSubmit={handleAddInstallment}
          className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label
              htmlFor={addValueId}
              className="mb-1 block text-xs font-medium text-muted"
            >
              Valor
            </label>
            <CurrencyInput
              id={addValueId}
              value={newValue}
              onValueChange={setNewValue}
              required
              disabled={isAddLoading}
              ariaLabel="Valor da nova parcela"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor={addDateId}
              className="mb-1 block text-xs font-medium text-muted"
            >
              Vencimento
            </label>
            <input
              id={addDateId}
              type="date"
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
              required
              disabled={isAddLoading}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
              aria-label="Data de vencimento da nova parcela"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAddLoading}
              className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
              aria-label="Adicionar parcela"
            >
              {isAddLoading ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </form>

        {addError ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            {addError}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remover parcela?"
        description={
          deleteTarget
            ? `A parcela #${deleteTarget.order} de ${formatCurrency(deleteTarget.value)} será removida. Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Remover"
        loadingLabel="Removendo..."
        isLoading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (isDeleteLoading) return
          setDeleteTarget(null)
          setDeleteError(null)
        }}
      />

      {deleteError ? (
        <p className="px-5 pb-4 text-sm text-danger" role="alert">
          {deleteError}
        </p>
      ) : null}
    </section>
  )
}
