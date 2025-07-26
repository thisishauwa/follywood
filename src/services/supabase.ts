import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'talk-to-august-app',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database types based on the schema
export interface User {
  id: string
  email: string
  age_range?: "16-20" | "21-25" | "26-30"
  gender?: string
  sexuality?: string
  relationship_status?: "single" | "dating" | "married" | "other"
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  text: string
  category: "intimacy" | "exploration" | "relationship" | "health"
  status: "active" | "completed"
  completion_date?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  message_text: string
  is_user_message: boolean
  created_at: string
}

export interface AudioGuide {
  id: string
  title: string
  description?: string
  duration: number
  file_path: string
  category: "enhance_intimacy" | "explore_sexuality" | "improve_communication" | null
  thumbnail_url?: string
  created_at: string
}

export interface SexualHappinessScore {
  id: string
  user_id: string
  score: number
  created_at: string
}
