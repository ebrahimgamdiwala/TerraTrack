import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }) {
  const [displayLocation, setDisplayLocation] = useState(useLocation())
  const [transitionStage, setTransitionStage] = useState('fadeIn')
  const location = useLocation()

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        transitionStage === 'fadeOut' 
          ? 'opacity-0 transform scale-95' 
          : 'opacity-100 transform scale-100'
      }`}
      onTransitionEnd={() => {
        if (transitionStage === 'fadeOut') {
          setDisplayLocation(location)
          setTransitionStage('fadeIn')
        }
      }}
    >
      {React.cloneElement(children, { key: displayLocation.pathname })}
    </div>
  )
}