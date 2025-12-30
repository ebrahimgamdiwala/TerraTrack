import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AuthPageLayout({ children, onGlobeZoom = false }) {
  const mountRef = useRef(null)
  
  useEffect(() => {
    if (!mountRef.current) return

    // Global variables to match original exactly
    let scene, camera, renderer, globe, atmosphere, moon, stars, clouds
    let targetRotation = { x: 0, y: 0 }
    let currentRotation = { x: 0, y: 0 }
    let initialCameraPosition = onGlobeZoom ? 4 : 7 // Zoom in for auth pages
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
        mountRef.current.appendChild(renderer.domElement)

        // Create globe with multiple texture layers
        const geometry = new THREE.SphereGeometry(2, 64, 64)
        
        // Load multiple textures for realistic appearance
        const textureLoader = new THREE.TextureLoader()
        
        // Load textures with proper configuration to avoid WebGL errors
        const earthTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg', (texture) => {
            texture.flipY = false
            texture.generateMipmaps = true
        })
        const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg', (texture) => {
            texture.flipY = false
            texture.generateMipmaps = true
        })
        const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg', (texture) => {
            texture.flipY = false
            texture.generateMipmaps = true
        })
        const cloudsTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png', (texture) => {
            texture.flipY = false
            texture.generateMipmaps = true
        })

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

        // Set initial camera position - closer for auth pages
        camera.position.z = initialCameraPosition
        camera.position.y = 0
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

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false)

        animate()
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
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
        
        const moonTexture = textureLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg', (texture) => {
            texture.flipY = false
            texture.generateMipmaps = true
        })
        const moonBumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg', (texture) => {
            texture.flipY = false
            texture.generateMipmaps = true
        })
        
        const moonMaterial = new THREE.MeshPhongMaterial({
            map: moonTexture,
            bumpMap: moonBumpMap,
            bumpScale: 0.02,
        })

        moon = new THREE.Mesh(moonGeometry, moonMaterial)
        
        // Create a container for the moon to handle the tilted orbit
        const moonOrbit = new THREE.Object3D()
        moonOrbit.rotation.x = THREE.MathUtils.degToRad(23.5)
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
        const earthDayDuration = 0.001
        currentRotation.y += earthDayDuration
        
        // Apply rotation to globe
        globe.rotation.y = currentRotation.y
        globe.rotation.x = THREE.MathUtils.degToRad(23.5)
        
        // Animate clouds
        if (clouds) {
            clouds.rotation.x = THREE.MathUtils.degToRad(23.5)
            clouds.rotation.y = currentRotation.y * 1.1
        }
        
        // Atmosphere follows Earth's movement
        if (atmosphere) {
            atmosphere.rotation.y = currentRotation.y * 0.95
            atmosphere.rotation.x = THREE.MathUtils.degToRad(23.5)
        }

        // Moon orbits Earth
        if (moon) {
            const moonOrbitSpeed = 0.0001
            const time = Date.now() * moonOrbitSpeed
            moon.position.x = Math.cos(time) * 5
            moon.position.z = Math.sin(time) * 5
            
            moon.rotation.y += moonOrbitSpeed
            moon.lookAt(new THREE.Vector3(0, 0, 0))
        }

        // Enhanced star animation
        if (stars) {
            stars.rotation.y += 0.0002
            
            const colors = stars.geometry.attributes.color.array
            for (let i = 0; i < colors.length; i += 3) {
                const time = Date.now() * 0.001
                
                const flickerSpeed = 0.5 + (Math.sin(i) * 0.5)
                const flicker = 0.7 + Math.sin(time * flickerSpeed + i) * 0.3
                
                const originalR = colors[i]
                const originalG = colors[i + 1]
                const originalB = colors[i + 2]
                
                const maxOriginal = Math.max(originalR, originalG, originalB)
                const ratio = maxOriginal > 0 ? 1 / maxOriginal : 1
                
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
      if (mountRef.current && renderer?.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      if (renderer) {
        renderer.dispose()
      }
    }
  }, [onGlobeZoom])

  return (
    <div className="min-h-screen relative">
      {/* Three.js Globe Background */}
      <div 
        ref={mountRef}
        className="fixed top-0 left-0 w-full h-full"
        style={{ 
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
      
      {/* Page Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}