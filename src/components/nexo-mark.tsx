type NexoMarkProps = {
  className?: string
}

export const NexoMark = ({ className }: NexoMarkProps) => (
  <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <line x1="22" y1="22" x2="10" y2="12" stroke="currentColor" strokeWidth="2" />
    <line x1="22" y1="22" x2="34" y2="12" stroke="currentColor" strokeWidth="2" />
    <line x1="22" y1="22" x2="10" y2="32" stroke="currentColor" strokeWidth="2" />
    <line x1="22" y1="22" x2="34" y2="32" stroke="currentColor" strokeWidth="2" />
    <circle cx="22" cy="22" r="4.5" fill="currentColor" />
    <circle cx="10" cy="12" r="2.6" fill="currentColor" />
    <circle cx="34" cy="12" r="2.6" fill="currentColor" />
    <circle cx="10" cy="32" r="2.6" fill="currentColor" />
    <circle cx="34" cy="32" r="2.6" fill="currentColor" />
  </svg>
)
