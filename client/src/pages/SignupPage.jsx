import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../routes'
import { authToasts, toastUtils } from '../utils/toast'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const { register } = useAuth()
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toastUtils.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toastUtils.error('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    })

    if (result.success) {
      authToasts.signupSuccess()
      setRegistrationComplete(true)
    } else {
      authToasts.signupError(result.error)
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
        overflowY: 'auto',
      }}
    >
      {/* Glassmorphism Card */}
      <div 
        className="auth-card backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl 
                   hover:bg-white/15 transition-all duration-300 ease-out"
        style={{ 
          width: '380px',
          maxWidth: '90vw',
          margin: '0 auto',
          padding: '20px 24px',
          position: 'relative',
          left: '0',
          right: '0',
          transform: 'none',
          animation: 'fadeInUp 0.5s ease-out forwards' 
        }}
      >

        {/* Header */}
        <div className="text-center mb-4">
          <Link to="/" className="inline-block mb-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-400 
                           bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
              TerraTrack
            </h1>
          </Link>
          <h2 className="text-lg font-semibold text-white mb-1">
            {!registrationComplete ? 'Create Account' : 'Check Your Email'}
          </h2>
          <p className="text-white/70 text-sm">
            {!registrationComplete
              ? 'Join us in making a difference'
              : `We've sent a verification link to ${formData.email}`
            }
          </p>
        </div>



        {!registrationComplete ? (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-white/90 text-xs font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 
                           text-white placeholder-white/50 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                           transition-all duration-300"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-white/90 text-xs font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 
                           text-white placeholder-white/50 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                           transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-white/90 text-xs font-medium mb-1">
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
                  className="w-full px-3 py-2 pr-10 text-sm rounded-lg bg-white/10 border border-white/20 
                             text-white placeholder-white/50 backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                             transition-all duration-300"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 
                             hover:text-white transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-white/90 text-xs font-medium mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 pr-10 text-sm rounded-lg bg-white/10 border border-white/20 
                             text-white placeholder-white/50 backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                             transition-all duration-300"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 
                             hover:text-white transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 text-sm rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 
                         text-white font-semibold shadow-lg hover:shadow-green-400/25
                         hover:from-green-300 hover:to-emerald-400 
                         transform hover:scale-[1.02] 
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        ) : (
          /* Registration Success Message */
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <svg className="h-16 w-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div>
              <p className="text-white/90 text-lg mb-2">
                Registration Successful!
              </p>
              <p className="text-white/70 mb-4">
                We've sent a verification link to your email address. Click the link to verify your account and complete the registration process.
              </p>
              <p className="text-white/60 text-sm">
                Don't see the email? Check your spam folder or try registering again.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to={ROUTES.LOGIN}
                className="block w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 
                           text-white font-semibold shadow-lg hover:shadow-green-400/25
                           hover:from-green-300 hover:to-emerald-400 
                           transform hover:scale-[1.02] hover:-translate-y-1 
                           transition-all duration-300 text-center"
              >
                Go to Login
              </Link>

              <button
                type="button"
                onClick={() => setRegistrationComplete(false)}
                className="w-full py-2 px-4 text-white/70 hover:text-white transition-colors duration-300"
              >
                ← Back to Registration
              </button>
            </div>
          </div>
        )}

        {/* Sign In Link */}
        {!registrationComplete && (
          <div className="mt-4 text-center">
            <p className="text-white/70 text-sm">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="text-green-300 hover:text-green-200 font-medium transition-colors duration-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}