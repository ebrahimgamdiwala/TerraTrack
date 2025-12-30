import { createContext, useContext, useState, useEffect } from 'react'
import { apiUtils, handleApiError, handleApiSuccess } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      // Verify token and get user details
      fetchUserDetails()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const fetchUserDetails = async () => {
    try {
      const response = await apiUtils.user.getProfile()
      const result = handleApiSuccess(response)
      setUser(result.data.data)
    } catch (error) {
      console.error('Error fetching user details:', error)
      // Token might be invalid, logout user
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await apiUtils.auth.login({ email, password })
      const result = handleApiSuccess(response)
      
      // Store tokens
      setToken(result.data.data.accessToken)
      localStorage.setItem('token', result.data.data.accessToken)
      localStorage.setItem('refreshToken', result.data.data.refreshToken)
      
      // Fetch user details after successful login
      try {
        const userResponse = await apiUtils.user.getProfile()
        const userResult = handleApiSuccess(userResponse)
        setUser(userResult.data.data)
        
        // Return success with user data  
        return {
          ...result,
          data: {
            ...result.data,
            user: userResult.data.data
          }
        }
      } catch (userError) {
        console.error('Error fetching user details after login:', userError)
        // Login was successful but couldn't fetch user details
        // Still return success so user can proceed
        return result
      }
      
    } catch (error) {
      return handleApiError(error)
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiUtils.auth.register(userData)
      return handleApiSuccess(response)
    } catch (error) {
      return handleApiError(error)
    }
  }

  const verifyEmail = async (email, otp) => {
    try {
      const response = await apiUtils.auth.verifyEmail({ email, otp })
      return handleApiSuccess(response)
    } catch (error) {
      return handleApiError(error)
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await apiUtils.auth.logout()
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await apiUtils.auth.forgotPassword(email)
      return handleApiSuccess(response)
    } catch (error) {
      return handleApiError(error)
    }
  }

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await apiUtils.auth.resetPassword({ email, otp, newPassword })
      return handleApiSuccess(response)
    } catch (error) {
      return handleApiError(error)
    }
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    verifyEmail,
    logout,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}