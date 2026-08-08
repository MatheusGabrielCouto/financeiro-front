type StatusBadgeProps = {
  status: "PAY" | "SCHEDULE"
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const isPaid = status === "PAY"

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        isPaid
          ? "bg-emerald-50 text-success dark:bg-emerald-950/40"
          : "bg-amber-50 text-warning dark:bg-amber-950/40"
      }`}
    >
      {isPaid ? "Pago" : "A pagar"}
    </span>
  )
}
