/**
 * Web Push subscription helper.
 *
 * - Registers /sw.js as a service worker (idempotent).
 * - Asks the user for Notification permission.
 * - Subscribes to PushManager with the server's VAPID public key.
 * - POSTs the subscription to /api/v1/push/subscribe.
 *
 * Returns { ok: true } when subscribed, otherwise { ok: false, reason }.
 */
import { api } from './api'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export type PushSubscribeResult =
  | { ok: true; endpoint: string }
  | { ok: false; reason: 'unsupported' | 'denied' | 'not-configured' | 'error'; detail?: string }

export async function enableWebPush(): Promise<PushSubscribeResult> {
  if (!(await isPushSupported())) return { ok: false, reason: 'unsupported' }

  // 1. Register or grab existing service worker
  let reg: ServiceWorkerRegistration
  try {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
  } catch (e) {
    return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : String(e) }
  }

  // 2. Ask permission
  let perm: NotificationPermission = Notification.permission
  if (perm === 'default') perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, reason: 'denied' }

  // 3. Get the VAPID public key from the server
  let publicKey = ''
  try {
    const res = await api.pushPublicKey()
    publicKey = res.public_key
  } catch (e) {
    return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : String(e) }
  }
  if (!publicKey) return { ok: false, reason: 'not-configured' }

  // 4. Subscribe (or reuse existing)
  let sub: PushSubscription
  try {
    const existing = await reg.pushManager.getSubscription()
    sub = existing
      ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Older PushManager typings require BufferSource/ArrayBuffer
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      })
  } catch (e) {
    return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : String(e) }
  }

  // 5. Send to backend
  const json = sub.toJSON()
  try {
    await api.pushSubscribe({
      endpoint: json.endpoint!,
      keys: {
        p256dh: (json.keys as { p256dh: string; auth: string }).p256dh,
        auth: (json.keys as { p256dh: string; auth: string }).auth,
      },
    })
  } catch (e) {
    return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : String(e) }
  }

  return { ok: true, endpoint: json.endpoint! }
}

export async function disableWebPush(): Promise<void> {
  if (!(await isPushSupported())) return
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await api.pushUnsubscribe({ endpoint: sub.endpoint }).catch(() => {})
      await sub.unsubscribe()
    }
  } catch { /* ignore */ }
}
