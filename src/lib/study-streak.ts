const toDateKey = (date: Date) => date.toISOString().slice(0, 10)

const addDaysUTC = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

/**
 * Consecutive days (ending today or yesterday) with at least one logged
 * study session. Today counts even before it's over — the streak only
 * breaks once a full day passes with nothing logged.
 */
export const computeStudyStreak = (sessionDates: string[], today: Date = new Date()) => {
  const dateSet = new Set(sessionDates)
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

  let cursor = dateSet.has(toDateKey(todayUTC)) ? todayUTC : addDaysUTC(todayUTC, -1)
  let streak = 0

  while (dateSet.has(toDateKey(cursor))) {
    streak += 1
    cursor = addDaysUTC(cursor, -1)
  }

  return streak
}
