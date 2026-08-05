import { AppShell } from "@/components/app-shell"
import { getStoredUser } from "@/lib/auth-cookies"
import { getPriorityNotificationCount } from "@/lib/notification-count"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getStoredUser()
  const notificationCount = user ? await getPriorityNotificationCount() : 0

  return (
    <AppShell user={user} notificationCount={notificationCount}>
      {children}
    </AppShell>
  )
}

export default AppLayout
