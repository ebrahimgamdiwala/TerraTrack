import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function VanillaGlobeScene() {
  const mountRef = useRef(null)
  
  useEffect(() => {
    // Ensure the component is mounted
    if (!mountRef.current) return
    
    // Force a layout to ensure the document has the correct scrollHeight
    document.body.style.height = "auto"
    
    // Only proceed when document is fully rendered
    setTimeout(() => {

    // Global variables to match original exactly
    let scene, camera, renderer, globe, atmosphere, moon, stars, clouds
    let targetRotation = { x: 0, y: 0 }
    let currentRotation = { x: 0, y: 0 }
    let initialCameraPosition = 7
    let lastScrollY = window.scrollY

    function init() {
        // Scene setup
        scene = new THREE.Scene()
        scene.background = new THREE.Color(0x000000)
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        
        // Safety check before appendChild
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement)
        } else {
            console.warn('VanillaGlobeScene: mountRef is null, cannot append canvas')
            return
        }

        // Create globe with multiple texture layers
        const geometry = new THREE.SphereGeometry(2, 64, 64)
        
        // Load multiple textures for realistic appearance
        const textureLoader = new THREE.TextureLoader()
        const earthTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg')
        const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg')
        const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg')
        const cloudsTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png')

        // Enhanced material with multiple maps
        const material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            specularMap: specularMap,
            specular: new THREE.Color('grey'),
            shininess: 10
        })
        
        globe = new THREE.Mesh(geometry, material)
        scene.add(globe)

        // Enhanced cloud layer
        const cloudGeometry = new THREE.SphereGeometry(2.005, 64, 64)
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: cloudsTexture,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
        clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
        scene.add(clouds)

        // Set initial camera position back to side view
        initialCameraPosition = 7
        camera.position.z = initialCameraPosition
        camera.position.y = 0 // Reset vertical position
        camera.lookAt(0, 0, 0)

        // Apply Earth's tilt after creating the globe
        globe.rotation.x = THREE.MathUtils.degToRad(23.5)
        
        // Add moon
        createMoon()
        
        // Add stars
        addStars()

        // Enhanced lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambientLight)
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0)
        mainLight.position.set(5, 3, 5)
        scene.add(mainLight)

        const backLight = new THREE.DirectionalLight(0xffffff, 0.4)
        backLight.position.set(-5, -3, -5)
        scene.add(backLight)

        // Handle window resize and scroll
        window.addEventListener('resize', onWindowResize, false)
        window.addEventListener('scroll', onScroll, false)
        
        // Handle globe zoom trigger from navbar
        window.addEventListener('globeZoom', onGlobeZoom, false)

        animate()
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    function onScroll() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        const scrollPercent = maxScroll > 0 ? window.scrollY / maxScroll : 0
        targetRotation.y = scrollPercent * Math.PI * 2
        
        const newZ = initialCameraPosition - (scrollPercent * 3)
        camera.position.z = Math.max(3.5, newZ)

        lastScrollY = window.scrollY
    }

    function onGlobeZoom(event) {
        const action = event.detail?.action
        const startZ = camera.position.z
        let targetZ
        
        // Determine target zoom based on action
        if (action === 'zoomIn') {
            targetZ = 4.5 // Zoom in for auth pages
        } else if (action === 'zoomOut') {
            targetZ = initialCameraPosition // Zoom out to original position
        } else {
            return // No action specified
        }
        
        const duration = 600 // Smooth transition duration
        const startTime = Date.now()

        function animateZoom() {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // Enhanced easing function for smoother animation
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2
            
            camera.position.z = startZ + (targetZ - startZ) * easeProgress
            
            if (progress < 1) {
                requestAnimationFrame(animateZoom)
            }
        }
        
        animateZoom()
    }

    function addStars() {
        const starGeometry = new THREE.BufferGeometry()
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        })

        const starVertices = []
        const starColors = []
        
        for (let i = 0; i < 3000; i++) {
            const radius = 20 + Math.random() * 30
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI * 2

            const x = radius * Math.sin(theta) * Math.cos(phi)
            const y = radius * Math.sin(theta) * Math.sin(phi)
            const z = radius * Math.cos(theta)

            starVertices.push(x, y, z)

            // Create varied star colors (white, blue-white, yellow-white)
            const colorChoice = Math.random()
            let r, g, b
            const intensity = 0.6 + Math.random() * 0.4

            if (colorChoice < 0.6) {  // 60% white stars
                r = g = b = intensity
            } else if (colorChoice < 0.8) {  // 20% blue-white stars
                r = intensity * 0.8
                g = intensity * 0.8
                b = intensity
            } else {  // 20% yellow-white stars
                r = intensity
                g = intensity
                b = intensity * 0.8
            }

            starColors.push(r, g, b)
        }

        starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3))
        starGeometry.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3))

        stars = new THREE.Points(starGeometry, starMaterial)
        scene.add(stars)
    }

    function createMoon() {
        const moonGeometry = new THREE.SphereGeometry(0.5, 32, 32)
        const textureLoader = new THREE.TextureLoader()
        
        const moonTexture = textureLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg')
        const moonBumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg')
        
        const moonMaterial = new THREE.MeshPhongMaterial({
            map: moonTexture,
            bumpMap: moonBumpMap,
            bumpScale: 0.02,
        })

        moon = new THREE.Mesh(moonGeometry, moonMaterial)
        
        // Create a container for the moon to handle the tilted orbit
        const moonOrbit = new THREE.Object3D()
        moonOrbit.rotation.x = THREE.MathUtils.degToRad(23.5) // Earth's axial tilt
        scene.add(moonOrbit)
        moonOrbit.add(moon)
        
        // Store the orbit container for animation
        moon.orbit = moonOrbit
        
        // Initial moon position
        moon.position.set(5, 0, 0)
    }

    function animate() {
        requestAnimationFrame(animate)

        // Earth's natural rotation period (24 hours)
        // Here we'll make it visible but still slow
        const earthDayDuration = 0.001 // Adjust for desired rotation speed
        currentRotation.y += earthDayDuration
        
        // Add scroll-based rotation
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.03
        
        // Apply combined rotation to globe
        globe.rotation.y = currentRotation.y
        globe.rotation.x = THREE.MathUtils.degToRad(23.5)
        
        // Animate clouds
        if (clouds) {
            // Match Earth's tilt
            clouds.rotation.x = THREE.MathUtils.degToRad(23.5)
            // Follow Earth's rotation with slight offset for independent movement
            clouds.rotation.y = currentRotation.y * 1.1  // Clouds move slightly faster than surface
        }
        
        // Atmosphere follows Earth's movement
        if (atmosphere) {
            atmosphere.rotation.y = currentRotation.y * 0.95
            atmosphere.rotation.x = THREE.MathUtils.degToRad(23.5)
        }

        // Moon orbits Earth every 27.3 days (sidereal period)
        if (moon) {
            const moonOrbitSpeed = 0.0001 // Adjusted for visualization
            const time = Date.now() * moonOrbitSpeed
            moon.position.x = Math.cos(time) * 5
            moon.position.z = Math.sin(time) * 5
            
            // Moon's rotation (tidally locked to Earth)
            moon.rotation.y += moonOrbitSpeed
            moon.lookAt(new THREE.Vector3(0, 0, 0))
        }

        // Enhanced star animation
        if (stars) {
            stars.rotation.y += 0.0002
            
            const colors = stars.geometry.attributes.color.array
            for (let i = 0; i < colors.length; i += 3) {
                const time = Date.now() * 0.001
                
                // Create more natural twinkling patterns
                const flickerSpeed = 0.5 + (Math.sin(i) * 0.5) // Varied speeds
                const flicker = 0.7 + Math.sin(time * flickerSpeed + i) * 0.3
                
                // Preserve original color ratios while twinkling
                const originalR = colors[i]
                const originalG = colors[i + 1]
                const originalB = colors[i + 2]
                
                // Calculate color ratios
                const maxOriginal = Math.max(originalR, originalG, originalB)
                const ratio = maxOriginal > 0 ? 1 / maxOriginal : 1
                
                // Apply flicker while maintaining color relationships
                colors[i] = originalR * ratio * flicker
                colors[i + 1] = originalG * ratio * flicker
                colors[i + 2] = originalB * ratio * flicker
                
                if (Math.random() < 0.001) {
                    colors[i] = colors[i + 1] = colors[i + 2] = 1.5
                }
            }
            stars.geometry.attributes.color.needsUpdate = true
        }

        renderer.render(scene, camera)
    }

    init()

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('globeZoom', onGlobeZoom)
      if (mountRef.current && renderer?.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      if (renderer) {
        renderer.dispose()
      }
    }
    
    // Close the setTimeout from earlier
    }, 100)
  }, [])

  return (
    <div 
      ref={mountRef}
      className="fixed top-0 left-0 w-full h-full"
      style={{ 
        zIndex: -10,
        pointerEvents: 'none'
      }}
    />
  )
}