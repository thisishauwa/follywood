export interface AuthUser {
  id: string
  email: string
  username?: string
  age_range?: "16-20" | "21-25" | "26-30"
  gender?: string
  sexuality?: string
  relationship_status?: "single" | "dating" | "married" | "other"
  created_at: string
  updated_at?: string
}

export interface AuthState {
  user: AuthUser | null
  session: any | null
  loading: boolean
  error: string | null
}

export interface LoginForm {
  email: string
  password: string
}

export interface SignUpForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface ResetPasswordForm {
  email: string
}
