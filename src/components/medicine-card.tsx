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

export const MedicineCard = ({ medicine }: MedicineCardProps) => {
  return (
    <li className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconPill className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{medicine.name}</p>
            <p className="text-xs text-muted">
              {medicine.quantity} {medicine.unit} · validade{" "}
              {formatExpiration(medicine.expirationMonth, medicine.expirationYear)}
            </p>
          </div>
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

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${medicineStatusClasses(medicine.status)}`}
        >
          {medicineStatusLabel(medicine.status)}
        </span>
        {medicine.isLowStock ? (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${lowStockClasses}`}
          >
            Estoque baixo
          </span>
        ) : null}
        {medicine.purpose.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-muted dark:bg-slate-900/50"
          >
            {item}
          </span>
        ))}
      </div>

      {medicine.notes ? (
        <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted">
          {medicine.notes}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <ProxyActionButton
          path={`/medicine/${medicine.id}/adjust`}
          method="PATCH"
          body={{ delta: -1 }}
          label="-1"
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
    </li>
  )
}
