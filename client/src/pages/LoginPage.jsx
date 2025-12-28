import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../routes'
import { authToasts } from '../utils/toast'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)

      if (result.success) {
        // Handle different possible data structures
        const userData = result.data?.data?.user || result.data?.user || result.user
        const userName = userData?.name || userData?.firstName || userData?.username

        authToasts.loginSuccess(userName)
        navigate(ROUTES.DASHBOARD)
      } else {
        authToasts.loginError(result.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      authToasts.loginError('An unexpected error occurred. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div 
      className="auth-page-container"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
      }}
    >
      {/* Glassmorphism Card */}
      <div 
        className="auth-card backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 
                   hover:bg-white/15 transition-all duration-300 ease-out"
        style={{ 
          width: '400px',
          maxWidth: '90vw',
          margin: '0 auto',
          position: 'relative',
          left: '0',
          right: '0',
          transform: 'none',
          animation: 'fadeInUp 0.5s ease-out forwards' 
        }}
      >

        {/* Header */}
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-block mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-400 
                           bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
              TerraTrack
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
          <p className="text-white/70">Sign in to continue your journey</p>
        </div>



        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-white/90 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                         text-white placeholder-white/50 backdrop-blur-sm
                         focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                         transition-all duration-300"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-white/90 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 
                           text-white placeholder-white/50 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                           transition-all duration-300"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 
                           hover:text-white transition-colors duration-200"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-green-300 hover:text-green-200 text-sm transition-colors duration-300"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 
                       text-white font-semibold shadow-lg hover:shadow-green-400/25
                       hover:from-green-300 hover:to-emerald-400 
                       transform hover:scale-[1.02] hover:-translate-y-1 
                       transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:hover:scale-100 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Forgot Password & Sign Up Links */}
        <div className="mt-6 text-center">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-green-300 hover:text-green-200 text-sm transition-colors duration-300"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className="text-white/70">
            Don't have an account?{' '}
            <Link
              to={ROUTES.SIGNUP}
              className="text-green-300 hover:text-green-200 font-medium transition-colors duration-300"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}