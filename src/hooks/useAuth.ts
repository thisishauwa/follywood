"use client"

import { useState, useEffect } from "react"
import AuthService, { type AuthResponse } from "../services/auth"
import { useAppStore } from "../store/useAppStore"

export const useAuth = () => {
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const { user, setUser } = useAppStore()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await AuthService.getCurrentSession()
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString(),
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  const handleSignUp = async (data: any): Promise<AuthResponse> => {
    setLoading(true)
    try {
      const result = await AuthService.createAccount(data)
      return result
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (data: any): Promise<AuthResponse> => {
    setLoading(true)
    try {
      const result = await AuthService.signIn(data)
      return result
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await AuthService.signOut()
      if (!error) {
        setUser(null)
      }
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (email: string) => {
    setLoading(true)
    try {
      const result = await AuthService.resetPassword(email)
      return result
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    initializing,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  }
}
