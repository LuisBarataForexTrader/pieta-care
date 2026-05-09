/**
 * Lightweight in-tab notification helper for new chat messages.
 *
 * - Plays a short sine "ping" via Web Audio (no asset, ~300ms)
 * - Fires a haptic buzz via the Vibration API on devices that support it
 *   (Android Chrome / Brave; iOS Safari does NOT support vibration)
 * - Optionally fires a Notification API toast when the tab is hidden and
 *   the user has previously granted permission
 *
 * Throttled to one fire per 1.5s so a burst of messages doesn't spam
 * the user.
 */

const STORAGE_KEY = 'pieta_notify_chat'   // '0' | '1' (default: enabled)
const THROTTLE_MS = 1500

let lastFiredAt = 0
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (audioCtx) return audioCtx
  const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  const Ctx = W.AudioContext ?? W.webkitAudioContext
  if (!Ctx) return null
  try {
    audioCtx = new Ctx()
    return audioCtx
  } catch {
    return null
  }
}

export function isChatNotifyEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) !== '0'
}

export function setChatNotifyEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
}

function playPing() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    // Some browsers suspend the AudioContext until a user gesture.
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    // Two-tone ping (high → mid) - gentle, not jarring
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.18)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
    osc.start(t)
    osc.stop(t + 0.35)
  } catch {
    // ignore
  }
}

function vibrate() {
  if (typeof navigator === 'undefined') return
  // Vibration is a no-op on iOS Safari but harmless to call
  const v = (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate
  if (typeof v === 'function') {
    try { v.call(navigator, [80, 60, 80]) } catch {}
  }
}

function browserNotify(title: string, body?: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return
  try {
    new Notification(title, { body, icon: '/favicon.ico', tag: 'pieta-chat' })
  } catch {}
}

export function notifyNewChatMessage(opts?: { title?: string; body?: string }) {
  if (!isChatNotifyEnabled()) return
  const now = Date.now()
  if (now - lastFiredAt < THROTTLE_MS) return
  lastFiredAt = now

  playPing()
  vibrate()
  if (opts?.title) browserNotify(opts.title, opts.body)
}

/** Request browser notification permission (call from a user gesture). */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return await Notification.requestPermission()
}
