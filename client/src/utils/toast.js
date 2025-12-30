import toast from 'react-hot-toast'

// Custom toast styles
const toastStyles = {
  success: {
    style: {
      background: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      color: '#22c55e',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
    },
    iconTheme: {
      primary: '#22c55e',
      secondary: 'rgba(34, 197, 94, 0.1)',
    },
  },
  error: {
    style: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#ef4444',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: 'rgba(239, 68, 68, 0.1)',
    },
  },
  loading: {
    style: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      color: '#3b82f6',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
    },
    iconTheme: {
      primary: '#3b82f6',
      secondary: 'rgba(59, 130, 246, 0.1)',
    },
  },
  custom: {
    style: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
    },
  },
}

// Toast utility functions
export const toastUtils = {
  // Success toast
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
      ...toastStyles.success,
    })
  },

  // Error toast
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options,
      ...toastStyles.error,
    })
  },

  // Loading toast
  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      ...options,
      ...toastStyles.loading,
    })
  },

  // Custom toast
  custom: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
      ...toastStyles.custom,
    })
  },

  // Promise toast (for async operations)
  promise: (promise, { loading, success, error }, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: loading || 'Loading...',
        success: success || 'Success!',
        error: error || 'Something went wrong',
      },
      {
        position: 'top-right',
        ...options,
        success: { ...toastStyles.success, ...options.success },
        error: { ...toastStyles.error, ...options.error },
        loading: { ...toastStyles.loading, ...options.loading },
      }
    )
  },

  // Dismiss all toasts
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  },

  // Remove all toasts
  remove: (toastId) => {
    if (toastId) {
      toast.remove(toastId)
    } else {
      toast.remove()
    }
  },
}

// Authentication specific toasts
export const authToasts = {
  loginSuccess: (userName) => {
    toastUtils.success(`Welcome back${userName ? `, ${userName}` : ''}!`, {
      duration: 3000,
    })
  },

  loginError: (error) => {
    toastUtils.error(error || 'Login failed. Please check your credentials.', {
      duration: 4000,
    })
  },

  signupSuccess: () => {
    toastUtils.success('Account created successfully! Please verify your email.', {
      duration: 5000,
    })
  },

  signupError: (error) => {
    toastUtils.error(error || 'Failed to create account. Please try again.', {
      duration: 4000,
    })
  },

  emailVerificationSuccess: () => {
    toastUtils.success('Email verified successfully! You can now sign in.', {
      duration: 4000,
    })
  },

  emailVerificationError: (error) => {
    toastUtils.error(error || 'Email verification failed. Please try again.', {
      duration: 4000,
    })
  },

  passwordResetSuccess: () => {
    toastUtils.success('Password reset successfully! You can now sign in.', {
      duration: 4000,
    })
  },

  passwordResetError: (error) => {
    toastUtils.error(error || 'Password reset failed. Please try again.', {
      duration: 4000,
    })
  },

  forgotPasswordSuccess: (email) => {
    toastUtils.success(`Reset code sent to ${email}. Please check your inbox.`, {
      duration: 5000,
    })
  },

  forgotPasswordError: (error) => {
    toastUtils.error(error || 'Failed to send reset code. Please try again.', {
      duration: 4000,
    })
  },

  logoutSuccess: () => {
    toastUtils.success('Logged out successfully!', {
      duration: 2000,
    })
  },

  sessionExpired: () => {
    toastUtils.error('Your session has expired. Please sign in again.', {
      duration: 4000,
    })
  },
}

// API related toasts
export const apiToasts = {
  networkError: () => {
    toastUtils.error('Network error. Please check your connection and try again.', {
      duration: 5000,
    })
  },

  serverError: (status) => {
    toastUtils.error(`Server error (${status}). Please try again later.`, {
      duration: 4000,
    })
  },

  validationError: (message) => {
    toastUtils.error(message || 'Please check your input and try again.', {
      duration: 4000,
    })
  },
}

export default toastUtils