/* Service worker mínimo para notificações locais do Financeiro */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = event.notification.data?.url || "/notificacoes"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(target)
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target)
        }
        return undefined
      })
  )
})
