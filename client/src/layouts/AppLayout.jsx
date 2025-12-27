import { Outlet, useLocation } from 'react-router-dom'
import VanillaGlobeScene from '../components/VanillaGlobeScene'
import Navbar from '../components/Navbar'

export default function AppLayout() {
  const location = useLocation()
  const isVisualiserPage = location.pathname === '/visualiser'

  return (
    <div className="relative min-h-screen">
      {/* Globe background - hidden on visualiser page which has its own globe */}
      {!isVisualiserPage && <VanillaGlobeScene />}

      {/* Navbar - hidden on visualiser page */}
      {!isVisualiserPage && <Navbar />}

      {/* Page content with smooth transitions */}
      <div className="relative">
        <div className="transition-opacity duration-300 ease-in-out">
          <Outlet />
        </div>
      </div>
    </div>
  )
}