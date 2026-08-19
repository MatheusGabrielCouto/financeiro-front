import { IconPill } from "@/components/icons"
import { ProxyActionButton } from "@/components/proxy-action-button"
import {
  formatExpiration,
  lowStockClasses,
  medicineStatusClasses,
  medicineStatusLabel,
} from "@/lib/medicine-status"
import type { Medicine } from "@/lib/types"

type MedicineCardProps = {
  medicine: Medicine
}

const statusAccentClass = (medicine: Medicine) => {
  if (medicine.status === "expired") return "ring-danger/25"
  if (medicine.status === "expiring_soon") return "ring-warning/25"
  if (medicine.isLowStock) return "ring-border"
  return "ring-success/20"
}

export const MedicineCard = ({ medicine }: MedicineCardProps) => {
  return (
    <li
      className={`rounded-2xl border border-border/70 bg-surface p-4 ring-1 ${statusAccentClass(medicine)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <IconPill className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
              {medicine.name}
            </p>
            <p className="mt-1 text-sm text-muted">
              Validade {formatExpiration(medicine.expirationMonth, medicine.expirationYear)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            {medicine.quantity}
          </p>
          <p className="text-xs text-muted">{medicine.unit}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${medicineStatusClasses(medicine.status)}`}
        >
          {medicineStatusLabel(medicine.status)}
        </span>
        {medicine.isLowStock ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${lowStockClasses}`}
          >
            Estoque baixo
          </span>
        ) : null}
        {medicine.purpose.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-border"
          >
            {item}
          </span>
        ))}
      </div>

      {medicine.notes ? (
        <p className="mt-3 rounded-xl bg-background/60 px-3 py-2 text-xs leading-relaxed text-muted ring-1 ring-border/70">
          {medicine.notes}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Ajustar estoque</span>
          <ProxyActionButton
            path={`/medicine/${medicine.id}/adjust`}
            method="PATCH"
            body={{ delta: -1 }}
            label="−1"
            loadingLabel="..."
            variant="ghost"
            ariaLabel={`Diminuir quantidade de ${medicine.name}`}
          />
          <ProxyActionButton
            path={`/medicine/${medicine.id}/adjust`}
            method="PATCH"
            body={{ delta: 1 }}
            label="+1"
            loadingLabel="..."
            variant="ghost"
            ariaLabel={`Aumentar quantidade de ${medicine.name}`}
          />
        </div>

        <ProxyActionButton
          path={`/medicine/${medicine.id}`}
          method="DELETE"
          label="Excluir"
          loadingLabel="Excluindo..."
          confirmTitle="Excluir remédio"
          confirmMessage={`Excluir "${medicine.name}" do estoque?`}
          variant="danger"
          ariaLabel={`Excluir remédio ${medicine.name}`}
        />
      </div>
    </li>
  )
}
