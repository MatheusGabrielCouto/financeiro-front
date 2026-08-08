import Link from "next/link"
import { getMoodOption } from "@/lib/journal-mood"
import { formatDateKey } from "@/lib/format"
import { htmlToPlainText } from "@/lib/html-text"
import type { JournalEntry } from "@/lib/types"

type JournalEntryCardProps = {
  entry: JournalEntry
  href: string
  active: boolean
}

export const JournalEntryCard = ({ entry, href, active }: JournalEntryCardProps) => {
  const mood = getMoodOption(entry.mood)

  return (
    <li>
      <Link
        href={href}
        className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
          active
            ? "border-accent/40 bg-accent-soft"
            : "border-border/80 bg-background/50 hover:bg-background"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-lg shadow-sm">
          {mood?.emoji ?? "📝"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{formatDateKey(entry.date)}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">
            {htmlToPlainText(entry.content)}
          </p>
        </div>
      </Link>
    </li>
  )
}
