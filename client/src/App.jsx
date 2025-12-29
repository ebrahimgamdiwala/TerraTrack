import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { Web3Provider } from './context/Web3Context'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import { routes, publicRoutes, privateRoutes } from './routes'

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-white text-center">
      <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-green-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-white/70">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                {/* Public Routes */}
                {publicRoutes.map((route) => {
                  const Component = route.element
                  return (
                    <Route
                      key={route.path}
                      path={route.path === '/' ? '' : route.path.slice(1)}
                      element={<Component />}
                    />
                  )
                })}
                
                {/* Protected Routes */}
                {privateRoutes.map((route) => {
                  const Component = route.element
                  return (
                    <Route
                      key={route.path}
                      path={route.path.slice(1)}
                      element={
                        <ProtectedRoute>
                          <Component />
                        </ProtectedRoute>
                      }
                    />
                  )
                })}
              </Route>
            </Routes>
          </Suspense>
          
          {/* Toast Container */}
          <Toaster
            position="top-right"
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
              },
            }}
          />
        </Router>
      </Web3Provider>
    </AuthProvider>
  )
}

export default App
