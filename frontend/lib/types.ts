export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  subscription_status: string
  is_verified: boolean
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

export interface Document {
  id: number
  elderly_id: number
  name: string
  file_type: string
  file_url: string
  notes: string | null
  uploaded_by_name: string
  created_at: string
}
