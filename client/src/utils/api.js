import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// API utility functions
export const apiUtils = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/api/user/login', credentials),
    register: (userData) => api.post('/api/user/register', userData),
    verifyEmail: (data) => api.post('/api/user/verify-email', data),
    forgotPassword: (email) => api.put('/api/user/forgot-password', { email }),
    resetPassword: (data) => api.put('/api/user/reset-password', data),
    logout: () => api.get('/api/user/logout'),
    refreshToken: (refreshToken) => api.post('/api/user/refresh-token', { refreshToken }),
  },

  // User endpoints
  user: {
    getProfile: () => api.get('/api/user/user-details'),
    updateProfile: (data) => api.put('/api/user/profile', data),
    deleteAccount: () => api.delete('/api/user/account'),
  },

  // Generic API methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config),
}

// Error handler utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      error: error.response.data?.message || `Server error: ${error.response.status}`,
      statusCode: error.response.status,
    }
  } else if (error.request) {
    // Request made but no response received
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    }
  } else {
    // Something else happened
    return {
      success: false,
      error: error.message || 'An unexpected error occurred.',
    }
  }
}

// Success handler utility
export const handleApiSuccess = (response, customMessage) => {
  return {
    success: true,
    data: response.data,
    message: customMessage || response.data?.message || 'Operation successful',
  }
}

export default api