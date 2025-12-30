import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES, navRoutes } from '../routes'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignUpClick = () => {
    // Trigger a zoom effect by dispatching a custom event
    window.dispatchEvent(new CustomEvent('globeZoom', { detail: { action: 'zoomIn' } }))
    
    // Navigate immediately using React Router
    navigate(ROUTES.SIGNUP)
  }

  const handleHomeClick = () => {
    // Trigger zoom out when going back to home
    window.dispatchEvent(new CustomEvent('globeZoom', { detail: { action: 'zoomOut' } }))
    navigate(ROUTES.HOME)
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.HOME)
  }

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out">
      <div className={`
        flex justify-between items-center px-8 py-4 rounded-full backdrop-blur-md
        bg-gradient-to-r from-green-500/20 to-emerald-500/20 
        border border-green-400/30 shadow-2xl hover:shadow-green-500/25
        transition-all duration-500 ease-out
        ${isScrolled 
          ? 'bg-green-500/30 border-green-400/50 shadow-green-500/30' 
          : 'bg-green-500/10 border-green-400/20'
        }
      `}>
        {/* Logo/Brand */}
        <button onClick={handleHomeClick} className="text-xl font-bold text-white mr-8">
          <span className="bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent 
                         hover:from-green-200 hover:to-emerald-300 transition-all duration-300">
            TerraTrack
          </span>
        </button>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              {/* Authenticated User Links */}
              {navRoutes.map((route) => (
                <Link 
                  key={route.path}
                  to={route.path} 
                  className="text-white/90 hover:text-green-300 font-medium text-sm
                           transition-all duration-300 hover:scale-105 hover:-translate-y-0.5
                           hidden sm:block"
                >
                  {route.name}
                </Link>
              ))}
              
              {/* Admin Only Links */}
              {user?.role === 'ADMIN' && (
                <Link 
                  to="/campaigns/create"
                  className="text-white/90 hover:text-green-300 font-medium text-sm
                           transition-all duration-300 hover:scale-105 hover:-translate-y-0.5
                           hidden sm:block px-3 py-1 border border-green-400/30 rounded-full
                           bg-green-500/20 hover:bg-green-500/30"
                >
                  ✨ Create Campaign
                </Link>
              )}

              {/* User Welcome & Logout */}
              <span className="text-white/70 text-sm hidden md:inline">
                Welcome, {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white 
                         font-semibold text-sm rounded-full border border-red-400/20
                         hover:from-red-400 hover:to-red-500 hover:border-red-300/30
                         transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-400/25
                         transition-all duration-300 backdrop-blur-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Guest User Links */}
              <Link
                to={ROUTES.LOGIN}
                className="text-white/90 hover:text-green-300 font-medium text-sm
                         transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
              >
                Sign In
              </Link>
              <button
                onClick={handleSignUpClick}
                className="px-6 py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white 
                         font-semibold text-sm rounded-full border border-green-300/20
                         hover:from-green-300 hover:to-emerald-400 hover:border-green-200/30
                         transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-400/25
                         transition-all duration-300 backdrop-blur-sm"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}