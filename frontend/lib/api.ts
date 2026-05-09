const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.pietas.care'
let _redirecting = false

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('elderly_id')
  document.cookie = 'token=; path=/; max-age=0'
}

export function getElderlyId(): number | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem('elderly_id')
  return v ? parseInt(v) : null
}

export function setElderlyId(id: number) {
  localStorage.setItem('elderly_id', String(id))
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  // cache: 'no-store' so the browser never serves stale data on refresh
  // (this app's GETs are user-specific real-time things - chat, presence,
  // billing status, etc.)
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...options, headers })
  if (res.status === 401) {
    clearToken()
    if (!_redirecting) {
      _redirecting = true
      window.location.replace('/login')
    }
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Erro desconhecido')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    request<{ access_token: string; user: import('./types').User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, full_name: string, elderly_name?: string, phone?: string, nif?: string) =>
    request<{ message: string; email: string; subscription_status: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, elderly_name, phone, nif }),
    }),

  verifyEmail: (token: string) =>
    request<{ access_token: string; user: import('./types').User }>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`),

  /** Lightweight poll used by the register/verify screen so the
   *  desktop tab auto-detects when the user clicks the link on mobile. */
  checkVerification: (email: string) =>
    request<{ verified: boolean }>(`/api/v1/auth/verification-status?email=${encodeURIComponent(email)}`),

  /** Returns whether the given email is already registered. Called from
   *  the registration step 1 so the "Email já registado" error surfaces
   *  before the user fills in step 2 (the elderly name). */
  checkEmail: (email: string) =>
    request<{ taken: boolean }>(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ access_token: string; user: import('./types').User }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  deleteAccount: () =>
    request<{ message: string }>('/api/v1/auth/account', { method: 'DELETE' }),

  exportData: () =>
    request<Record<string, unknown>>('/api/v1/auth/export'),

  submitFeedback: (rating: number, comment?: string, source?: string) =>
    request<{ id: number; rating: number; created_at: string }>('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating, comment, source }),
    }),

  pushPublicKey: () =>
    request<{ public_key: string }>('/api/v1/push/public-key'),
  pushSubscribe: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    request<{ ok: boolean }>('/api/v1/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
  pushUnsubscribe: (sub: { endpoint: string }) =>
    request<{ ok: boolean }>('/api/v1/push/unsubscribe', { method: 'POST', body: JSON.stringify(sub) }),

  me: () => request<import('./types').User>('/api/v1/auth/me'),

  ping: () => request<void>('/api/v1/auth/ping', { method: 'POST' }),

  // billing
  listPlans: () => request<import('./types').Plan[]>('/api/v1/billing/plans'),

  billingStatus: () => request<import('./types').BillingStatus>('/api/v1/billing/status'),

  createCheckoutSession: (plan: string) =>
    request<{ url: string }>('/api/v1/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  billingPortal: () => request<{ url: string }>('/api/v1/billing/portal'),

  listInvoices: () => request<import('./types').Invoice[]>('/api/v1/billing/invoices'),

  // family chat
  listChat: (elderlyId: number, sinceId?: number) =>
    request<import('./types').ChatMessage[]>(
      `/api/v1/elderly/${elderlyId}/chat${sinceId ? `?since_id=${sinceId}` : ''}`
    ),

  sendChat: (elderlyId: number, content: string) =>
    request<import('./types').ChatMessage>(`/api/v1/elderly/${elderlyId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  markChatRead: (elderlyId: number, lastReadMessageId: number) =>
    request<void>(`/api/v1/elderly/${elderlyId}/chat/read`, {
      method: 'POST',
      body: JSON.stringify({ last_read_message_id: lastReadMessageId }),
    }),

  chatUnread: (elderlyId: number) =>
    request<import('./types').ChatUnread>(`/api/v1/elderly/${elderlyId}/chat/unread`),

  // support chat
  supportSummary: () => request<import('./types').SupportSummary>('/api/v1/support/me'),

  listSupportMessages: () =>
    request<import('./types').SupportMessage[]>('/api/v1/support/messages'),

  sendSupportMessage: (content: string) =>
    request<import('./types').SupportMessage>('/api/v1/support/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  adminListSupportThreads: () =>
    request<import('./types').SupportThread[]>('/api/v1/support/admin/threads'),

  adminListSupportHouseholds: () =>
    request<import('./types').SupportHousehold[]>('/api/v1/support/admin/households'),

  adminGetSupportThread: (threadId: number) =>
    request<{ thread: import('./types').SupportThread; messages: import('./types').SupportMessage[] }>(
      `/api/v1/support/admin/threads/${threadId}`
    ),

  adminReplySupport: (threadId: number, content: string) =>
    request<import('./types').SupportMessage>(`/api/v1/support/admin/threads/${threadId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  adminSupportUnread: () =>
    request<{ unread: number }>('/api/v1/support/admin/unread'),

  adminDeleteSupportMessage: (messageId: number) =>
    request<void>(`/api/v1/support/admin/messages/${messageId}`, { method: 'DELETE' }),

  acceptInvite: (token: string, password: string, full_name: string) =>
    request<{ access_token: string; user: import('./types').User; elderly_id: number }>(
      '/api/v1/auth/invite/accept',
      {
        method: 'POST',
        body: JSON.stringify({ token, password, full_name }),
      }
    ),

  // elderly
  listElderly: () => request<import('./types').Elderly[]>('/api/v1/elderly'),

  createElderly: (data: Partial<import('./types').Elderly>) =>
    request<import('./types').Elderly>('/api/v1/elderly', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateElderly: (id: number, data: Partial<import('./types').Elderly>) =>
    request<import('./types').Elderly>(`/api/v1/elderly/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  inviteFamily: (elderlyId: number, email: string, relation?: string) =>
    request(`/api/v1/elderly/${elderlyId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, relation }),
    }),

  removeFamilyMember: (elderlyId: number, memberId: number) =>
    request(`/api/v1/elderly/${elderlyId}/members/${memberId}`, { method: 'DELETE' }),

  // medications
  listMedications: (elderlyId: number) =>
    request<import('./types').Medication[]>(`/api/v1/elderly/${elderlyId}/medications`),

  createMedication: (elderlyId: number, data: { name: string; dosage: string; schedule_times: string[]; instructions?: string; is_prn?: boolean }) =>
    request<import('./types').Medication>(`/api/v1/elderly/${elderlyId}/medications`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMedication: (elderlyId: number, medId: number, data: Partial<import('./types').Medication>) =>
    request<import('./types').Medication>(`/api/v1/elderly/${elderlyId}/medications/${medId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteMedication: (elderlyId: number, medId: number) =>
    request(`/api/v1/elderly/${elderlyId}/medications/${medId}`, { method: 'DELETE' }),

  fetchMedicationInfo: (elderlyId: number, medId: number, refresh = false) =>
    request<import('./types').Medication>(
      `/api/v1/elderly/${elderlyId}/medications/${medId}/fetch-info?refresh=${refresh}`,
      { method: 'POST' }
    ),

  aiInsights: (elderlyId: number) =>
    request<{
      elderly_id: number; elderly_name: string;
      generated_at: string; period_days: number;
      markdown: string; context_summary: Record<string, unknown>;
    }>(`/api/v1/elderly/${elderlyId}/ai/insights`, { method: 'POST' }),

  dailySchedule: (elderlyId: number, date?: string) =>
    request<import('./types').DailyScheduleItem[]>(
      `/api/v1/elderly/${elderlyId}/medications/schedule/today${date ? `?for_date=${date}` : ''}`
    ),

  confirmMedication: (elderlyId: number, medication_id: number, scheduled_time: string, status: string) =>
    request(`/api/v1/elderly/${elderlyId}/medications/confirm`, {
      method: 'POST',
      body: JSON.stringify({ medication_id, scheduled_time, status }),
    }),

  medicationHistory: (elderlyId: number, days = 30) =>
    request<import('./types').MedicationLog[]>(
      `/api/v1/elderly/${elderlyId}/medications/history?days=${days}`
    ),

  // calendar events
  listEvents: (elderlyId: number) =>
    request<import('./types').CalendarEvent[]>(`/api/v1/elderly/${elderlyId}/events`),

  createEvent: (elderlyId: number, data: Partial<import('./types').CalendarEvent>) =>
    request<import('./types').CalendarEvent>(`/api/v1/elderly/${elderlyId}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (elderlyId: number, eventId: number, data: Partial<import('./types').CalendarEvent>) =>
    request<import('./types').CalendarEvent>(`/api/v1/elderly/${elderlyId}/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteEvent: (elderlyId: number, eventId: number) =>
    request(`/api/v1/elderly/${elderlyId}/events/${eventId}`, { method: 'DELETE' }),

  // tasks
  listTasks: (elderlyId: number) =>
    request<import('./types').Task[]>(`/api/v1/elderly/${elderlyId}/tasks`),

  createTask: (elderlyId: number, data: Partial<import('./types').Task>) =>
    request<import('./types').Task>(`/api/v1/elderly/${elderlyId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (elderlyId: number, taskId: number, data: Partial<import('./types').Task>) =>
    request<import('./types').Task>(`/api/v1/elderly/${elderlyId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTask: (elderlyId: number, taskId: number) =>
    request(`/api/v1/elderly/${elderlyId}/tasks/${taskId}`, { method: 'DELETE' }),

  // documents
  listDocuments: (elderlyId: number) =>
    request<import('./types').Document[]>(`/api/v1/elderly/${elderlyId}/documents`),

  uploadDocument: (elderlyId: number, file: File, name: string, notes?: string) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    if (notes) form.append('notes', notes)
    return fetch(`${BASE}/api/v1/elderly/${elderlyId}/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(r => r.json()) as Promise<import('./types').Document>
  },

  deleteDocument: (elderlyId: number, docId: number) =>
    request(`/api/v1/elderly/${elderlyId}/documents/${docId}`, { method: 'DELETE' }),

  // vitals
  listVitals: (elderlyId: number, days = 30) =>
    request<import('./types').VitalSign[]>(`/api/v1/elderly/${elderlyId}/vitals?days=${days}`),

  createVital: (elderlyId: number, data: Partial<import('./types').VitalSign>) =>
    request<import('./types').VitalSign>(`/api/v1/elderly/${elderlyId}/vitals`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteVital: (elderlyId: number, vitalId: number) =>
    request(`/api/v1/elderly/${elderlyId}/vitals/${vitalId}`, { method: 'DELETE' }),

  // wellbeing
  listWellbeing: (elderlyId: number, days = 30) =>
    request<import('./types').WellbeingLog[]>(`/api/v1/elderly/${elderlyId}/wellbeing?days=${days}`),

  todayWellbeing: (elderlyId: number) =>
    request<import('./types').WellbeingLog | null>(`/api/v1/elderly/${elderlyId}/wellbeing/today`),

  logWellbeing: (elderlyId: number, data: Partial<import('./types').WellbeingLog>) =>
    request<import('./types').WellbeingLog>(`/api/v1/elderly/${elderlyId}/wellbeing`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // incidents
  listIncidents: (elderlyId: number, includeResolved = false) =>
    request<import('./types').Incident[]>(`/api/v1/elderly/${elderlyId}/incidents?include_resolved=${includeResolved}`),

  createIncident: (elderlyId: number, data: Partial<import('./types').Incident>) =>
    request<import('./types').Incident>(`/api/v1/elderly/${elderlyId}/incidents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateIncident: (elderlyId: number, incidentId: number, data: Partial<import('./types').Incident>) =>
    request<import('./types').Incident>(`/api/v1/elderly/${elderlyId}/incidents/${incidentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteIncident: (elderlyId: number, incidentId: number) =>
    request(`/api/v1/elderly/${elderlyId}/incidents/${incidentId}`, { method: 'DELETE' }),

  // PRN medication
  logPrn: (elderlyId: number, medicationId: number, notes?: string) =>
    request(`/api/v1/elderly/${elderlyId}/medications/${medicationId}/prn`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  // daily notes
  listNotes: (elderlyId: number, days = 30) =>
    request<import('./types').DailyNote[]>(`/api/v1/elderly/${elderlyId}/notes?days=${days}`),

  createNote: (elderlyId: number, data: Partial<import('./types').DailyNote>) =>
    request<import('./types').DailyNote>(`/api/v1/elderly/${elderlyId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteNote: (elderlyId: number, noteId: number) =>
    request(`/api/v1/elderly/${elderlyId}/notes/${noteId}`, { method: 'DELETE' }),

  // care plan
  listCarePlan: (elderlyId: number, includeInactive = false) =>
    request<import('./types').CarePlanItem[]>(`/api/v1/elderly/${elderlyId}/care-plan?include_inactive=${includeInactive}`),

  createCarePlanItem: (elderlyId: number, data: Partial<import('./types').CarePlanItem>) =>
    request<import('./types').CarePlanItem>(`/api/v1/elderly/${elderlyId}/care-plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCarePlanItem: (elderlyId: number, itemId: number, data: Partial<import('./types').CarePlanItem>) =>
    request<import('./types').CarePlanItem>(`/api/v1/elderly/${elderlyId}/care-plan/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCarePlanItem: (elderlyId: number, itemId: number) =>
    request(`/api/v1/elderly/${elderlyId}/care-plan/${itemId}`, { method: 'DELETE' }),

  // clinical diagnoses
  listDiagnoses: (elderlyId: number, includeInactive = false) =>
    request<import('./types').ClinicalDiagnosis[]>(`/api/v1/elderly/${elderlyId}/diagnoses?include_inactive=${includeInactive}`),

  createDiagnosis: (elderlyId: number, data: Partial<import('./types').ClinicalDiagnosis>) =>
    request<import('./types').ClinicalDiagnosis>(`/api/v1/elderly/${elderlyId}/diagnoses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDiagnosis: (elderlyId: number, dxId: number, data: Partial<import('./types').ClinicalDiagnosis>) =>
    request<import('./types').ClinicalDiagnosis>(`/api/v1/elderly/${elderlyId}/diagnoses/${dxId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDiagnosis: (elderlyId: number, dxId: number) =>
    request(`/api/v1/elderly/${elderlyId}/diagnoses/${dxId}`, { method: 'DELETE' }),

  // vaccinations
  listVaccinations: (elderlyId: number) =>
    request<import('./types').Vaccination[]>(`/api/v1/elderly/${elderlyId}/vaccinations`),

  createVaccination: (elderlyId: number, data: Partial<import('./types').Vaccination>) =>
    request<import('./types').Vaccination>(`/api/v1/elderly/${elderlyId}/vaccinations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteVaccination: (elderlyId: number, vacId: number) =>
    request(`/api/v1/elderly/${elderlyId}/vaccinations/${vacId}`, { method: 'DELETE' }),

  uploadElderlyPhoto: (elderlyId: number, file: File) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/api/v1/elderly/${elderlyId}/photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async r => {
      if (!r.ok) throw new Error('Upload falhou')
      return r.json()
    }) as Promise<{ photo_url: string }>
  },
}
