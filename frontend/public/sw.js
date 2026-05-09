/* pietas.care service worker - handles Web Push notifications.
 * Kept intentionally tiny: receive a push, show a notification, route
 * the click. No offline caching for now (HTTPS-only host).
 */

self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()) })

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (_) { /* ignore */ }
  const title = data.title || 'pietas.care'
  const body = data.body || ''
  const url = data.url || '/dashboard'
  const tag = data.tag || 'pietas-default'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag,
      data: { url },
      requireInteraction: data.requireInteraction === true,
      vibrate: data.vibrate || [120, 80, 120],
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          try { w.navigate(url) } catch (_) { /* ignore - older browsers */ }
          return w.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
