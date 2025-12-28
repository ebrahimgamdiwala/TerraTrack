import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toastUtils } from '../utils/toast'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await forgotPassword(email)
    
    if (result.success) {
      toastUtils.success('Reset code sent to your email!')
      setStep(2)
    } else {
      toastUtils.error(result.error)
    }
    
    setIsLoading(false)
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (newPassword !== confirmPassword) {
      toastUtils.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      toastUtils.error('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    const result = await resetPassword(email, otp, newPassword)
    
    if (result.success) {
      toastUtils.success('Password reset successfully! You can now sign in with your new password.')
      navigate('/login')
    } else {
      toastUtils.error(result.error)
    }
    
    setIsLoading(false)
  }

  const resendOTP = async () => {
    setIsLoading(true)
    
    const result = await forgotPassword(email)
    
    if (result.success) {
      toastUtils.success('New code sent to your email!')
    } else {
      toastUtils.error(result.error)
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
            <Link to="/" className="inline-block mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-400 
                           bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                TerraTrack
              </h1>
            </Link>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {step === 1 ? 'Reset Password' : step === 2 ? 'Enter Code' : 'New Password'}
            </h2>
            <p className="text-white/70">
              {step === 1 
                ? 'Enter your email to receive a reset code' 
                : step === 2 
                ? `We've sent a code to ${email}`
                : 'Create your new password'
              }
            </p>
          </div>



          {step === 1 ? (
            /* Email Form */
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-white/90 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                           text-white placeholder-white/50 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                           transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>

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
                    Sending Code...
                  </div>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          ) : step === 2 ? (
            /* OTP Verification */
            <div className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-white/90 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                           text-white placeholder-white/50 backdrop-blur-sm text-center text-lg tracking-widest
                           focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                           transition-all duration-300"
                  placeholder="Enter 6-digit code"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={isLoading}
                  className="text-green-300 hover:text-green-200 text-sm transition-colors duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Didn't receive the code? Resend
                </button>
              </div>

              <button
                type="button"
                onClick={() => otp.length === 6 && setStep(3)}
                disabled={otp.length !== 6}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 
                         text-white font-semibold shadow-lg hover:shadow-green-400/25
                         hover:from-green-300 hover:to-emerald-400 
                         transform hover:scale-[1.02] hover:-translate-y-1 
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                Continue
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 px-4 text-white/70 hover:text-white transition-colors duration-300"
              >
                ← Back to Email
              </button>
            </div>
          ) : (
            /* New Password Form */
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-white/90 text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 
                             text-white placeholder-white/50 backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                             transition-all duration-300"
                    placeholder="Enter new password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-white/90 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 
                             text-white placeholder-white/50 backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50
                             transition-all duration-300"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 
                             hover:text-white transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
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
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 px-4 text-white/70 hover:text-white transition-colors duration-300"
              >
                ← Back to Code
              </button>
            </form>
          )}

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-white/70">
              Remember your password?{' '}
              <Link 
                to="/login" 
                className="text-green-300 hover:text-green-200 font-medium transition-colors duration-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
    </div>
  )
}