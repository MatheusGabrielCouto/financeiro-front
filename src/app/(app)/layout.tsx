import { AppShell } from "@/components/app-shell"
import { getStoredUser } from "@/lib/auth-cookies"
import { getCategories } from "@/lib/finance-api"
import { getPriorityNotificationCount } from "@/lib/notification-count"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getStoredUser()
  const [notificationCount, categories] = user
    ? await Promise.all([
        getPriorityNotificationCount(),
        getCategories().catch(() => []),
      ])
    : [0, []]

  return (
    <AppShell
      user={user}
      notificationCount={notificationCount}
      categories={categories}
    >
      {children}
    </AppShell>
  )
}

export default AppLayout
