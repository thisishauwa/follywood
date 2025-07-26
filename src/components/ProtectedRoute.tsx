import type React from "react"
import type { ReactNode } from "react"
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"
import { useAuthContext } from "./AuthProvider"

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { user, loading, initializing } = useAuthContext()

  if (initializing || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!user) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={styles.container}>
        <Text style={styles.text}>Please sign in to continue</Text>
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 16,
    color: "#64748B",
    fontFamily: "Larsseit",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    fontFamily: "Larsseit",
  },
})
