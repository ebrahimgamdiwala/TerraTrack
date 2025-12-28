import { Outlet, useLocation } from 'react-router-dom'
import VanillaGlobeScene from '../components/VanillaGlobeScene'
import SolarSystemNavbar from '../components/SolarSystemNavbar'

export default function AppLayout() {
  const location = useLocation()
  const isVisualiserPage = location.pathname === '/visualiser'
  const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password'].includes(location.pathname)

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Globe background - hidden on visualiser page which has its own globe */}
      {!isVisualiserPage && <VanillaGlobeScene />}

      {/* Solar System Navbar - hidden on visualiser page */}
      {!isVisualiserPage && <SolarSystemNavbar />}

      {/* Page content with smooth transitions */}
      <div className={`relative w-full ${isAuthPage ? '' : 'min-h-screen'}`}>
        <div className="transition-opacity duration-300 ease-in-out w-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}