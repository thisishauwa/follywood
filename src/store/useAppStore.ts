import { create } from "zustand"
import type { User, JournalEntry, Goal, ChatMessage } from "../services/supabase"

interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean

  // Chat state
  messages: ChatMessage[]
  isTyping: boolean

  // Journal state
  journalEntries: JournalEntry[]
  currentDraft: string

  // Goals state
  goals: Goal[]

  // Sexual Happiness Score
  happinessScore: number

  // Actions
  setUser: (user: User | null) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  setIsTyping: (isTyping: boolean) => void
  setJournalEntries: (entries: JournalEntry[]) => void
  setCurrentDraft: (draft: string) => void
  setGoals: (goals: Goal[]) => void
  setHappinessScore: (score: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  messages: [],
  isTyping: false,
  journalEntries: [],
  currentDraft: "",
  goals: [],
  happinessScore: 0,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [message, ...state.messages],
    })),
  setIsTyping: (isTyping) => set({ isTyping }),
  setJournalEntries: (journalEntries) => set({ journalEntries }),
  setCurrentDraft: (currentDraft) => set({ currentDraft }),
  setGoals: (goals) => set({ goals }),
  setHappinessScore: (happinessScore) => set({ happinessScore }),
}))
