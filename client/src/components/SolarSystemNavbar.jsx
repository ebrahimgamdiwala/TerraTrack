import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as THREE from 'three'
import './SolarSystemNavbar.css'

// Local texture paths
const TEXTURE_PATHS = {
    sun: '/textures/8k_sun.jpg',
    mercury: '/textures/mercury.jpg',
    venus: '/textures/venus.jpg',
    earth: '/textures/earth.jpg',
    mars: '/textures/mars.jpg',
    jupiter: '/textures/jupiter.jpg',
    saturn: '/textures/saturn.jpg',
    saturnRing: '/textures/saturn_ring.png',
    stars: '/textures/8k_stars.jpg',
}

// Planet configuration - all positioned in visible semicircle
const PLANETS = [
    {
        name: 'Mercury',
        label: 'Dashboard',
        route: '/dashboard',
        radius: 1.2,
        orbitRadius: 7.0,
        textureKey: 'mercury',
        startAngle: Math.PI * 0.3,
        orbitSpeed: 0.003,
        requiresAuth: true,
    },
    {
        name: 'Venus',
        label: 'Campaigns',
        route: '/campaigns',
        radius: 1.4,
        orbitRadius: 10.0,
        textureKey: 'venus',
        startAngle: Math.PI * 0.5,
        orbitSpeed: 0.0024,
        requiresAuth: true,
    },
    {
        name: 'Earth',
        label: 'My Donations',
        route: '/my-donations',
        radius: 1.5,
        orbitRadius: 13.5,
        textureKey: 'earth',
        startAngle: Math.PI * 0.7,
        orbitSpeed: 0.002,
        requiresAuth: true,
    },
    {
        name: 'Mars',
        label: 'Alerts',
        route: '/alerts',
        radius: 1.3,
        orbitRadius: 17.0,
        textureKey: 'mars',
        startAngle: Math.PI * 0.9,
        orbitSpeed: 0.0016,
        requiresAuth: true,
    },
    {
        name: 'Jupiter',
        label: 'TerraBot',
        route: '/terrabot',
        radius: 2.2,
        orbitRadius: 21.5,
        textureKey: 'jupiter',
        startAngle: Math.PI * 1.1,
        orbitSpeed: 0.0012,
        requiresAuth: true,
    },
    {
        name: 'Saturn',
        label: 'Visualiser',
        route: '/visualiser',
        radius: 1.8,
        orbitRadius: 26.0,
        textureKey: 'saturn',
        startAngle: Math.PI * 1.3,
        hasRings: true,
        orbitSpeed: 0.001,
        requiresAuth: false,
    },
]

export default function SolarSystemNavbar() {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [hoveredPlanet, setHoveredPlanet] = useState(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [orbitLabels, setOrbitLabels] = useState([])
    const navigate = useNavigate()
    const { isAuthenticated, user, logout } = useAuth()

    const sceneRef = useRef(null)
    const cameraRef = useRef(null)
    const rendererRef = useRef(null)
    const planetsRef = useRef([])
    const sunRef = useRef(null)
    const orbitRingsRef = useRef([])
    const starsRef = useRef(null)
    const raycasterRef = useRef(new THREE.Raycaster())
    const mouseRef = useRef(new THREE.Vector2())
    const animationRef = useRef(null)
    const isExpandedRef = useRef(false)
    const timeRef = useRef(0)

    useEffect(() => {
        isExpandedRef.current = isExpanded
    }, [isExpanded])

    const handleHomeClick = useCallback(() => {
        setIsExpanded(false)
        setTimeout(() => navigate('/'), 50)
    }, [navigate])

    const handleLogout = useCallback(async () => {
        setIsExpanded(false)
        await logout()
        setTimeout(() => navigate('/'), 50)
    }, [logout, navigate])

    const handlePlanetClick = useCallback((planet) => {
        setIsExpanded(false)
        const route = planet.requiresAuth && !isAuthenticated ? '/login' : planet.route
        setTimeout(() => navigate(route), 50)
    }, [isAuthenticated, navigate])

    useEffect(() => {
        if (!canvasRef.current || sceneRef.current) return

        const scene = new THREE.Scene()
        sceneRef.current = scene

        // View size to fit entire system centered
        const viewSize = 60
        const aspect = window.innerWidth / window.innerHeight
        const camera = new THREE.OrthographicCamera(
            -viewSize * aspect / 2,
            viewSize * aspect / 2,
            viewSize / 2,
            -viewSize / 2,
            0.1,
            100
        )
        camera.position.set(0, 50, 0)
        camera.lookAt(0, 0, 0)
        camera.up.set(0, 0, -1)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000510, 0)
        rendererRef.current = renderer

        const textureLoader = new THREE.TextureLoader()

        // Star background
        textureLoader.load(TEXTURE_PATHS.stars, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            const starGeo = new THREE.PlaneGeometry(200, 200)
            const starMat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0,
            })
            const starPlane = new THREE.Mesh(starGeo, starMat)
            starPlane.rotation.x = -Math.PI / 2
            starPlane.position.y = -1
            scene.add(starPlane)
            starsRef.current = starPlane
        })

        // Sun at center-top (half visible when collapsed)
        const sunRadius = 4.5
        const sunGeometry = new THREE.CircleGeometry(sunRadius, 64)
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            side: THREE.DoubleSide,
        })

        textureLoader.load(TEXTURE_PATHS.sun, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            sunMaterial.map = texture
            sunMaterial.color.setHex(0xffffff)
            sunMaterial.needsUpdate = true
        })

        const sun = new THREE.Mesh(sunGeometry, sunMaterial)
        sun.rotation.x = -Math.PI / 2
        // Position sun so it's centered when expanded, half visible when collapsed
        sun.position.set(0, 0, -viewSize / 2 - sunRadius * 0.3)
        scene.add(sun)
        sunRef.current = sun

        // Sun glow layers
        const glowConfigs = [
            { size: 1.2, opacity: 0.5, color: 0xffdd44 },
            { size: 1.5, opacity: 0.3, color: 0xffaa22 },
            { size: 1.9, opacity: 0.15, color: 0xff6600 },
        ]

        glowConfigs.forEach((cfg, i) => {
            const glowGeo = new THREE.CircleGeometry(sunRadius * cfg.size, 64)
            const glowMat = new THREE.MeshBasicMaterial({
                color: cfg.color,
                transparent: true,
                opacity: cfg.opacity,
                side: THREE.DoubleSide,
            })
            const glow = new THREE.Mesh(glowGeo, glowMat)
            glow.rotation.x = -Math.PI / 2
            glow.position.copy(sun.position)
            glow.position.y = -0.01 * (i + 1)
            scene.add(glow)
            sun.userData.glows = sun.userData.glows || []
            sun.userData.glows.push(glow)
        })

        // Create orbit rings
        const orbits = []
        PLANETS.forEach((config) => {
            const orbitGeometry = new THREE.RingGeometry(
                config.orbitRadius - 0.03,
                config.orbitRadius + 0.03,
                128
            )
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x22c55e,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
            })
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial)
            orbit.rotation.x = -Math.PI / 2
            orbit.position.set(0, -0.01, 0)
            scene.add(orbit)
            orbits.push(orbit)
        })
        orbitRingsRef.current = orbits

        // Create planets
        const planets = []

        PLANETS.forEach((config, index) => {
            const geometry = new THREE.SphereGeometry(config.radius, 48, 48)
            const material = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa,
                metalness: 0.1,
                roughness: 0.7,
            })

            textureLoader.load(TEXTURE_PATHS[config.textureKey], (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace
                material.map = texture
                material.color.setHex(0xffffff)
                material.needsUpdate = true
            })

            const planet = new THREE.Mesh(geometry, material)
            planet.userData = { ...config, index, angle: config.startAngle }

            planet.visible = false
            planet.position.set(0, -10, 0)

            scene.add(planet)
            planets.push(planet)

            // Saturn's rings
            if (config.hasRings) {
                const ringGeo = new THREE.RingGeometry(config.radius * 1.4, config.radius * 2.2, 64)
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xc9b896,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8,
                })

                textureLoader.load(TEXTURE_PATHS.saturnRing, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace
                    ringMat.map = texture
                    ringMat.needsUpdate = true
                })

                const ring = new THREE.Mesh(ringGeo, ringMat)
                ring.rotation.x = Math.PI / 2.5
                planet.add(ring)
            }
        })
        planetsRef.current = planets

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
        scene.add(ambientLight)

        const sunLight = new THREE.PointLight(0xffdd88, 2, 50)
        sunLight.position.set(0, 5, 0)
        scene.add(sunLight)

        const handleResize = () => {
            const newAspect = window.innerWidth / window.innerHeight
            camera.left = -viewSize * newAspect / 2
            camera.right = viewSize * newAspect / 2
            camera.top = viewSize / 2
            camera.bottom = -viewSize / 2
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', handleResize)

        const sunCollapsedZ = -viewSize / 2 - sunRadius * 0.3
        const sunExpandedZ = 0 // Sun moves to center when expanded

        // Function to convert 3D position to screen position
        const toScreenPosition = (position) => {
            const vector = position.clone()
            vector.project(camera)
            return {
                x: (vector.x * 0.5 + 0.5) * window.innerWidth,
                y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
            }
        }

        const animate = () => {
            animationRef.current = requestAnimationFrame(animate)
            timeRef.current += 0.016

            const isExp = isExpandedRef.current
            const time = timeRef.current

            if (starsRef.current) {
                const targetOpacity = isExp ? 0.8 : 0
                starsRef.current.material.opacity += (targetOpacity - starsRef.current.material.opacity) * 0.04
            }

            // Sun moves to center when expanded
            const sunTargetZ = isExp ? sunExpandedZ : sunCollapsedZ
            if (sunRef.current) {
                sunRef.current.position.z += (sunTargetZ - sunRef.current.position.z) * 0.05

                if (sunRef.current.userData.glows) {
                    sunRef.current.userData.glows.forEach((glow) => {
                        glow.position.z = sunRef.current.position.z
                    })
                }

                const pulse = 1 + Math.sin(time * 1.5) * 0.015
                sunRef.current.scale.set(pulse, pulse, 1)
            }

            const currentSunZ = sunRef.current?.position.z || sunExpandedZ

            // Update orbit positions to center on sun
            orbitRingsRef.current.forEach((orbit) => {
                orbit.position.z = currentSunZ
                const targetOpacity = isExp ? 0.5 : 0
                orbit.material.opacity += (targetOpacity - orbit.material.opacity) * 0.04
            })

            // Update orbit labels positions
            const newLabels = []
            planetsRef.current.forEach((planet, i) => {
                const config = PLANETS[i]

                planet.visible = isExp

                // Very slow orbital revolution
                if (isExp) {
                    planet.userData.angle += config.orbitSpeed
                }

                const angle = planet.userData.angle
                const targetX = Math.cos(angle) * config.orbitRadius
                const targetZ = currentSunZ + Math.sin(angle) * config.orbitRadius
                const targetY = isExp ? 0.1 : -10

                planet.position.x += (targetX - planet.position.x) * 0.05
                planet.position.z += (targetZ - planet.position.z) * 0.05
                planet.position.y += (targetY - planet.position.y) * 0.05

                // Self-rotation
                planet.rotation.y += 0.006

                // Calculate label position
                if (isExp && planet.position.y > -5) {
                    const labelAngle = planet.userData.angle + 0.12
                    const labelPos = new THREE.Vector3(
                        Math.cos(labelAngle) * config.orbitRadius,
                        0,
                        currentSunZ + Math.sin(labelAngle) * config.orbitRadius
                    )
                    const screenPos = toScreenPosition(labelPos)
                    newLabels.push({
                        ...config,
                        x: screenPos.x,
                        y: screenPos.y,
                    })
                }
            })

            if (isExp) {
                setOrbitLabels(newLabels)
            } else {
                setOrbitLabels([])
            }

            renderer.render(scene, camera)
        }
        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationRef.current)
            renderer.dispose()
            sceneRef.current = null
        }
    }, [])

    const handleMouseMove = useCallback((event) => {
        if (!isExpanded || !cameraRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        setMousePos({ x: event.clientX, y: event.clientY })

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
        // Recursive = true to hit rings
        const intersects = raycasterRef.current.intersectObjects(planetsRef.current, true)

        if (intersects.length > 0) {
            // Find the object that has the planet data (could be the mesh or its parent)
            let object = intersects[0].object
            let planetData = object.userData

            // If hit the ring, the data is on the parent
            if (!planetData.name && object.parent) {
                planetData = object.parent.userData
                object = object.parent
            }

            if (planetData && planetData.name) {
                setHoveredPlanet(planetData)
                document.body.style.cursor = 'pointer'
                // Scale the planet (parent if we hit ring)
                object.scale.setScalar(1.15)
            }
        } else {
            setHoveredPlanet(null)
            document.body.style.cursor = 'default'
            planetsRef.current.forEach(p => p.scale.setScalar(1))
        }
    }, [isExpanded])

    const handleClick = useCallback((event) => {
        if (!cameraRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

        if (isExpanded) {
            // Recursive = true to hit rings
            const planetIntersects = raycasterRef.current.intersectObjects(planetsRef.current, true)
            if (planetIntersects.length > 0) {
                let object = planetIntersects[0].object
                let planetData = object.userData

                // If hit the ring, get data from parent
                if (!planetData.name && object.parent) {
                    planetData = object.parent.userData
                }

                if (planetData && planetData.name) {
                    handlePlanetClick(planetData)
                    return
                }
            }
        }

        if (sunRef.current) {
            const sunIntersects = raycasterRef.current.intersectObject(sunRef.current)
            if (sunIntersects.length > 0) {
                if (!isExpanded) {
                    setIsExpanded(true)
                } else {
                    handleHomeClick()
                }
                return
            }
        }

        if (isExpanded) {
            setIsExpanded(false)
        }
    }, [isExpanded, handleHomeClick, handlePlanetClick])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isExpanded) {
                setIsExpanded(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isExpanded])

    return (
        <div
            ref={containerRef}
            className={`solar-system-navbar ${isExpanded ? 'expanded' : ''}`}
        >
            <div
                className={`solar-backdrop ${isExpanded ? 'visible' : ''}`}
                onClick={() => setIsExpanded(false)}
            />

            <canvas
                ref={canvasRef}
                className={`solar-canvas ${isExpanded ? 'interactive' : ''}`}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            />

            {!isExpanded && (
                <div
                    className="sun-trigger"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsExpanded(true)
                    }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '120px',
                        height: '60px',
                        cursor: 'pointer',
                        zIndex: 1000,
                        pointerEvents: 'auto',
                    }}
                />
            )}

            {/* Orbit Labels */}
            {orbitLabels.map((label) => (
                <div
                    key={label.name}
                    className={`orbit-label ${hoveredPlanet?.name === label.name ? 'hovered' : ''}`}
                    style={{ left: label.x, top: label.y }}
                >
                    <span className="orbit-planet-name">
                        {hoveredPlanet?.name === label.name ? label.label : label.name}
                    </span>
                </div>
            ))}

            {hoveredPlanet && isExpanded && (
                <div
                    className="planet-tooltip"
                    style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
                >
                    <span className="planet-name">{hoveredPlanet.name}</span>
                    <span className="planet-label">{hoveredPlanet.label}</span>
                </div>
            )}

            <div className={`sun-label ${isExpanded ? 'visible' : ''}`}>
                <span className="terratrack-text">TerraTrack</span>
            </div>

            {isExpanded && (
                <div className="solar-auth-buttons">
                    {isAuthenticated ? (
                        <>
                            <span className="user-welcome">
                                Welcome, {user?.name || user?.email}
                            </span>
                            <button onClick={handleLogout} className="solar-logout-btn">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setIsExpanded(false); setTimeout(() => navigate('/login'), 50); }}
                                className="solar-signin-btn"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setIsExpanded(false); setTimeout(() => navigate('/signup'), 50); }}
                                className="solar-signup-btn"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            )}

            {!isExpanded && (
                <div className="sun-hint">
                    Click the sun to navigate
                </div>
            )}
        </div>
    )
}
