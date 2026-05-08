export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  subscription_status: string
  is_verified: boolean
  is_admin?: boolean
}

export interface Plan {
  key: string
  name: string
  price: number
  max_elderly: number
  max_family_members: number | null
  has_ai: boolean
  features: string[]
}

export interface BillingStatus {
  status: string
  plan: string | null
  plan_name: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  has_subscription: boolean
  /** Highest tier the user has access to RIGHT NOW. Considers own
   *  subscription + any household where they're an accepted member.
   *  null = no access (paywall everywhere except /conta + /suporte). */
  effective_plan: 'familia' | 'familia_plus' | 'cuidador_pro' | null
}

export interface Invoice {
  id: string
  amount: number          // cents
  currency: string
  status: string
  created: string
  invoice_url: string | null
}

export interface ChatMessage {
  id: number
  elderly_id: number
  sender_id: number
  sender_name: string
  content: string
  created_at: string
}

export interface ChatUnread {
  elderly_id: number
  unread: number
  last_message_id: number | null
}

export interface SupportMessage {
  id: number
  thread_id: number
  sender_id: number
  sender_name: string
  is_admin_reply: boolean
  content: string
  created_at: string
}

export interface SupportThread {
  id: number
  user_id: number
  user_name: string
  user_email: string
  status: string
  last_message_at: string | null
  user_unread: number
  admin_unread: number
  last_message_preview: string | null
  created_at: string
}

export interface SupportSummary {
  thread_id: number | null
  has_thread: boolean
  unread: number
}

export interface SupportHouseholdMember {
  thread_id: number
  user_id: number
  user_name: string
  user_email: string
  user_phone: string | null
  is_owner: boolean
  last_message_at: string | null
  last_message_preview: string | null
  admin_unread: number
}

export interface SupportHousehold {
  owner_user_id: number
  owner_name: string
  owner_email: string
  owner_phone: string | null
  subscription_status: string
  subscription_plan: string | null
  elderly_names: string[]
  members: SupportHouseholdMember[]
  total_admin_unread: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface FamilyMember {
  id: number
  invited_email: string
  full_name: string | null
  role: string
  relation: string | null
  is_accepted: boolean
  can_manage_medications: boolean
  can_manage_documents: boolean
  joined_at: string | null
  last_seen_at: string | null
}

export interface Elderly {
  id: number
  full_name: string
  date_of_birth: string | null
  photo_url: string | null
  id_number: string | null
  health_number: string | null
  address: string | null
  medical_conditions: string | null
  allergies: string | null
  blood_type: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
  family_members: FamilyMember[]
}

export interface Medication {
  id: number
  elderly_id: number
  name: string
  dosage: string
  instructions: string | null
  schedule_times: string[]
  is_active: boolean
  is_prn: boolean
  description: string | null
  description_fetched_at: string | null
  created_at: string
}

export interface DailyScheduleItem {
  medication_id: number
  name: string
  dosage: string
  instructions: string | null
  scheduled_time: string
  status: 'pending' | 'taken' | 'skipped' | 'missed'
  log_id: number | null
  confirmed_by_name: string | null
  confirmed_at: string | null
}

export interface CalendarEvent {
  id: number
  elderly_id: number
  title: string
  description: string | null
  location: string | null
  doctor_name: string | null
  preparation_notes: string | null
  items_to_bring: string | null
  starts_at: string
  ends_at: string | null
  event_type: string
  is_completed: boolean
  created_at: string
}

export interface Task {
  id: number
  elderly_id: number
  title: string
  description: string | null
  due_date: string | null
  assigned_to_name: string | null
  is_completed: boolean
  priority: string
  created_at: string
}

export interface VitalSign {
  id: number
  elderly_id: number
  recorded_by_name: string
  measured_at: string
  blood_pressure_sys: number | null
  blood_pressure_dia: number | null
  heart_rate: number | null
  temperature: number | null
  weight: number | null
  oxygen_saturation: number | null
  blood_glucose: number | null
  notes: string | null
  created_at: string
}

export interface WellbeingLog {
  id: number
  elderly_id: number
  recorded_by_name: string
  logged_date: string
  mood: number
  energy: number | null
  pain_level: number | null
  appetite: number | null
  notes: string | null
  created_at: string
}

export interface Incident {
  id: number
  elderly_id: number
  reported_by_name: string
  occurred_at: string
  type: string
  severity: string
  description: string
  actions_taken: string | null
  follow_up_required: boolean
  resolved: boolean
  body_zone: string | null
  created_at: string
}

export interface DailyNote {
  id: number
  elderly_id: number
  recorded_by_name: string
  note_date: string
  shift: string
  content: string
  mood_observed: string | null
  created_at: string
}

export interface CarePlanItem {
  id: number
  elderly_id: number
  created_by_name: string
  category: string
  title: string
  description: string | null
  frequency: string | null
  is_active: boolean
  created_at: string
}

export interface ClinicalDiagnosis {
  id: number
  elderly_id: number
  created_by_name: string
  description: string
  icd_code: string | null
  diagnosed_date: string | null
  is_chronic: boolean
  is_active: boolean
  source: string | null
  notes: string | null
  created_at: string
}

export interface Vaccination {
  id: number
  elderly_id: number
  created_by_name: string
  vaccine_name: string
  administered_date: string | null
  next_due_date: string | null
  lot_number: string | null
  source: string | null
  notes: string | null
  created_at: string
}

export interface MedicationLog {
  id: number
  medication_id: number
  medication_name: string
  dosage: string
  confirmed_by_name: string
  scheduled_time: string
  confirmed_at: string
  status: string
  notes: string | null
}

export interface Document {
  id: number
  elderly_id: number
  uploaded_by: number
  uploaded_by_name: string
  name: string
  category: string
  mime_type: string | null
  file_size: number | null
  notes: string | null
  document_date: string | null
  created_at: string
  download_url: string
}
