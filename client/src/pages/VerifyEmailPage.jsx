import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../routes'
import { authToasts } from '../utils/toast'
import { apiUtils, handleApiSuccess, handleApiError } from '../utils/api'

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Debug: Log that the component is mounting
  console.log('VerifyEmailPage component mounted')

  const verifyEmailCode = async () => {
      const code = searchParams.get('code')
      console.log('Verification code from URL:', code)
      
      if (!code) {
        console.log('No code found in URL')
        setVerificationStatus('error')
        authToasts.emailVerificationError('Invalid verification link. Please check your email.')
        return
      }

      console.log('Starting email verification...')
      setIsLoading(true)
      
      try {
        // Call the API directly with the code from URL
        // Backend expects { code } in the request body
        console.log('Making API call with code:', code)
        const response = await apiUtils.auth.verifyEmail({ code })
        console.log('API response:', response)
        const result = handleApiSuccess(response)
        console.log('Processed result:', result)
        
        if (result.success) {
          console.log('Email verification successful')
          setVerificationStatus('success')
          authToasts.emailVerificationSuccess()
          
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate(ROUTES.LOGIN)
          }, 3000)
        } else {
          console.log('Email verification failed:', result.error)
          setVerificationStatus('error')
          authToasts.emailVerificationError(result.error || 'Email verification failed')
        }
      } catch (error) {
        const errorResult = handleApiError(error)
        console.error('Verification error:', error)
        setVerificationStatus('error')
        authToasts.emailVerificationError(errorResult.error || 'An unexpected error occurred during verification')
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    verifyEmailCode()
  }, [searchParams, navigate])

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
            <h2 className="text-2xl font-semibold text-white mb-2">
              {verificationStatus === 'verifying' ? 'Verifying Email' : 
               verificationStatus === 'success' ? 'Email Verified!' : 
               'Verification Failed'}
            </h2>
          </div>

          {/* Content */}
          <div className="text-center">
            {verificationStatus === 'verifying' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-12 w-12 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-white/70">
                  Please wait while we verify your email address...
                </p>
                <p className="text-white/50 text-sm">
                  Code: {searchParams.get('code')}
                </p>
                <p className="text-white/50 text-sm">
                  Status: {verificationStatus} | Loading: {isLoading.toString()}
                </p>
                <button 
                  onClick={() => {
                    const code = searchParams.get('code')
                    console.log('Manual test - code:', code)
                    verifyEmailCode()
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Manual Test Verify
                </button>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <svg className="h-16 w-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/90 text-lg mb-2">
                    Your email has been successfully verified!
                  </p>
                  <p className="text-white/70">
                    You will be redirected to the login page in a few seconds.
                  </p>
                </div>
                
                <Link 
                  to={ROUTES.LOGIN}
                  className="inline-block py-3 px-6 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 
                           text-white font-semibold shadow-lg hover:shadow-green-400/25
                           hover:from-green-300 hover:to-emerald-400 
                           transform hover:scale-[1.02] hover:-translate-y-1 
                           transition-all duration-300"
                >
                  Continue to Login
                </Link>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <svg className="h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/90 text-lg mb-2">
                    Email verification failed
                  </p>
                  <p className="text-white/70 mb-6">
                    The verification link may be invalid or expired. Please try signing up again or contact support.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Link 
                    to={ROUTES.SIGNUP}
                    className="block w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 
                             text-white font-semibold shadow-lg hover:shadow-green-400/25
                             hover:from-green-300 hover:to-emerald-400 
                             transform hover:scale-[1.02] hover:-translate-y-1 
                             transition-all duration-300"
                  >
                    Try Signing Up Again
                  </Link>
                  
                  <Link 
                    to={ROUTES.LOGIN}
                    className="block w-full py-2 px-4 text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}