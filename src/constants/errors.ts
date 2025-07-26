export const AUTH_ERRORS = {
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PASSWORD: "Password must be at least 8 characters long",
  PASSWORDS_DONT_MATCH: "Passwords do not match",
  USER_NOT_FOUND: "No account found with this email address",
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists",
  WEAK_PASSWORD: "Password is too weak",
  NETWORK_ERROR: "Network error. Please check your connection",
  UNKNOWN_ERROR: "An unexpected error occurred",
  EMAIL_NOT_CONFIRMED: "Please check your email and click the confirmation link",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later",
} as const

export const getAuthErrorMessage = (error: any): string => {
  if (!error) return AUTH_ERRORS.UNKNOWN_ERROR

  const errorMessage = error.message?.toLowerCase() || ""

  if (errorMessage.includes("invalid login credentials")) {
    return AUTH_ERRORS.INVALID_CREDENTIALS
  }

  if (errorMessage.includes("user not found")) {
    return AUTH_ERRORS.USER_NOT_FOUND
  }

  if (errorMessage.includes("email already registered")) {
    return AUTH_ERRORS.EMAIL_ALREADY_EXISTS
  }

  if (errorMessage.includes("password is too weak")) {
    return AUTH_ERRORS.WEAK_PASSWORD
  }

  if (errorMessage.includes("email not confirmed")) {
    return AUTH_ERRORS.EMAIL_NOT_CONFIRMED
  }

  if (errorMessage.includes("too many requests")) {
    return AUTH_ERRORS.TOO_MANY_REQUESTS
  }

  if (errorMessage.includes("network")) {
    return AUTH_ERRORS.NETWORK_ERROR
  }

  return error.message || AUTH_ERRORS.UNKNOWN_ERROR
}
