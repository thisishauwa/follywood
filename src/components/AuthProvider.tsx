"use client"

import type React from "react"
import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "../hooks/useAuth"
import type { User } from "@supabase/supabase-js"
import type { AuthResponse, SignUpData, SignInData } from "../services/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  initializing: boolean
  signUp: (data: SignUpData) => Promise<AuthResponse>
  signIn: (data: SignInData) => Promise<AuthResponse>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<AuthResponse>
  signInWithApple: () => Promise<AuthResponse>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
