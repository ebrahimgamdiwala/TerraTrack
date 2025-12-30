import React, { useRef, useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- PLANT CONFIGS WITH GLTF MODELS ---
// This configuration is now updated to include all your plant models.
// The paths assume each model has its own folder inside `public/models/`.
const PLANT_CONFIGS = [
  {
    id: 'aglaonema_plant',
    name: 'Aglaonema Plant',
    co2Reduction: 5.0,
    benefits: [
      'Excellent at filtering indoor air pollutants.',
      'Tolerant of low-light conditions.',
      'Known for its beautifully patterned leaves.'
    ],
    gltfPath: '/models/aglaonema_plant/scene.gltf',
    scale: [0.8, 0.8, 0.8],
    infoCardYOffset: 1.5,
  },
  {
    id: 'house_palm_plant',
    name: 'House Palm Plant',
    co2Reduction: 8.5,
    benefits: [
      'Adds a tropical feel to any space.',
      'Acts as a natural humidifier.',
      'Relatively easy to care for.'
    ],
    gltfPath: '/models/house_palm_plant/scene.gltf',
    scale: [0.6, 0.6, 0.6],
    infoCardYOffset: 2.5,
  },
  {
    id: 'low_poly_snake_plant',
    name: 'Snake Plant',
    co2Reduction: 6.5,
    benefits: [
      'Releases oxygen at night.',
      'Extremely durable and hard to kill.',
      'Filters formaldehyde from the air.'
    ],
    gltfPath: '/models/low_poly_snake_plant/scene.gltf',
    scale: [0.7, 0.7, 0.7],
    infoCardYOffset: 2.0,
  },
  {
    id: 'majesty_palm_plant',
    name: 'Majesty Palm',
    co2Reduction: 9.0,
    benefits: [
      'A majestic and fast-growing palm.',
      'Effective at purifying the air.',
      'Thrives in bright, indirect light.'
    ],
    gltfPath: '/models/majesty_palm_plant/scene.gltf',
    scale: [0.5, 0.5, 0.5],
    infoCardYOffset: 3.0,
  },
  {
    id: 'ficus_bonsai',
    name: 'Ficus Bonsai',
    co2Reduction: 4.0,
    benefits: [
      'A symbol of harmony and balance.',
      'Improves indoor air quality.',
      'A relaxing hobby that reduces stress.'
    ],
    gltfPath: '/models/ficus_bonsai/scene.gltf',
    scale: [1.0, 1.0, 1.0],
    infoCardYOffset: 1.2,
  },
];


// --- GLTF MODEL LOADER COMPONENT ---
function Model({ gltfPath }) {
  const { scene } = useGLTF(gltfPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}


// --- 3D PLANT COMPONENT (USES GLTF) ---
function Plant({ id, config, position, onSelect, isSelected }) {
  const ref = useRef();
  
  useFrame(() => {
    if (ref.current && isSelected) {
        ref.current.rotation.y += 0.005;
    }
  });

  const handleSelect = (e) => {
    e.stopPropagation();
    if(onSelect) {
      onSelect(id);
    }
  }

  return (
    <group ref={ref} position={position} scale={config.scale} onClick={handleSelect} dispose={null}>
        <Suspense fallback={null}>
            <Model gltfPath={config.gltfPath} />
        </Suspense>
        {isSelected && (
            <Html position={[0, config.infoCardYOffset, 0]} center>
                <div className="bg-gradient-to-br from-green-800 via-gray-900 to-gray-900 text-white p-5 rounded-xl shadow-2xl backdrop-blur-md border border-green-500/40 w-64 pointer-events-none transform -translate-y-1/2">
                    <div className="text-center mb-3">
                        <p className="text-sm text-green-300 uppercase font-semibold">Removes</p>
                        <p className="text-4xl font-bold text-white">{config.co2Reduction} kg</p>
                        <p className="text-sm text-green-300">of CO₂ per year</p>
                    </div>
                    <h3 className="text-lg font-bold text-center text-white mb-3 border-t border-green-500/30 pt-3">{config.name}</h3>
                    <ul className="space-y-2 text-sm">
                    {config.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-2 mt-1">🌿</span>
                        <span className="text-gray-200">{benefit}</span>
                        </li>
                    ))}
                    </ul>
                </div>
            </Html>
        )}
    </group>
  );
}

// --- AR COMPONENT ---
function CameraAR({ isActive, onPlantPlace, selectedModel, placedPlants }) {
  const videoRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError('Camera access denied. Please allow permissions and try again.');
    }
  }, []);
  
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  const handleTapToPlace = (event) => {
    if (!selectedModel || !cameraReady) return;
    const { clientX, clientY, currentTarget } = event;
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    const worldPosition = [x * 2.5, -1.5, y * -2.5 + -2];
    onPlantPlace(worldPosition);
  };
  
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
      <div className="absolute inset-0 w-full h-full" onClick={handleTapToPlace}>
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-lg">Starting camera...</p>
            </div>
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
            <div className="text-white text-center max-w-md">
              <p className="text-4xl mb-4">📷</p>
              <p className="text-lg mb-4">{cameraError}</p>
              <button onClick={startCamera} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Try Again
              </button>
            </div>
          </div>
        )}
        {cameraReady && (
          <>
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent text-white text-center">
              <p className="text-lg font-semibold">Tap to place a {selectedModel?.name}</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 border-2 border-green-400 rounded-full bg-green-400/20 animate-pulse"></div>
            </div>
          </>
        )}
      </div>
      {cameraReady && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }} style={{ background: 'transparent' }}>
            <Suspense fallback={null}>
               <Environment preset="sunset" />
               {placedPlants.map(plant => (
                 <Plant key={plant.id} {...plant} onSelect={() => {}} isSelected={false} />
               ))}
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function ARPlantsPage() {
  const [isARActive, setIsARActive] = useState(false);
  const [placedPlants, setPlacedPlants] = useState([]);
  const [selectedModel, setSelectedModel] = useState(PLANT_CONFIGS[0]);
  const [selectedPlantId, setSelectedPlantId] = useState(null);

  // Preload all GLTF models for a smoother experience
  useEffect(() => {
    PLANT_CONFIGS.forEach(config => useGLTF.preload(config.gltfPath));
  }, []);

  const totalCo2Reduction = placedPlants.reduce((total, plant) => total + plant.config.co2Reduction, 0).toFixed(1);

  const handlePlantPlace = useCallback((position) => {
    if (selectedModel) {
      setPlacedPlants(prev => [...prev, {
        id: crypto.randomUUID(),
        config: selectedModel,
        position: position
      }]);
    }
  }, [selectedModel]);
  
  const handleSelectPlantInPreview = useCallback((instanceId) => {
    setSelectedPlantId(prevId => (prevId === instanceId ? null : instanceId));
  }, []);

  const addPlantToPreview = useCallback(() => {
    if (selectedModel) {
        setPlacedPlants(prev => [...prev, {
            id: crypto.randomUUID(),
            config: selectedModel,
            position: [(Math.random() - 0.5) * 6, -1.5, (Math.random() - 0.5) * 6]
        }]);
    }
  }, [selectedModel]);
  
  const clearPlants = useCallback(() => {
    setPlacedPlants([]);
    setSelectedPlantId(null);
  }, []);

  const startAR = useCallback(() => setIsARActive(true), []);
  const stopAR = useCallback(() => setIsARActive(false), []);
  
  const loadingSpinner = <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-300"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white font-sans pt-20">
      <CameraAR isActive={isARActive} onPlantPlace={handlePlantPlace} selectedModel={selectedModel} placedPlants={placedPlants} />
      <div className={`relative z-10 container mx-auto px-4 py-8 transition-opacity duration-500 ${isARActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">Your Carbon Garden</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/80">Place virtual plants from 3D models to see their real environmental impact.</p>
        </header>
        
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-green-300">1. Choose a Plant Type</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {PLANT_CONFIGS.map(config => (
              <button key={config.id}
                className={`relative bg-black/20 backdrop-blur-sm border-2 rounded-2xl p-4 text-left transition-all duration-300 hover:scale-105 hover:bg-black/30 flex flex-col ${selectedModel?.id === config.id ? 'border-green-400' : 'border-white/10'}`}
                onClick={() => setSelectedModel(config)}>
                <div className="h-56 mb-2 rounded-xl overflow-hidden bg-gray-800">
                  <Suspense fallback={loadingSpinner}>
                      <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
                        <Environment preset="sunset" />
                        <Plant config={config} position={[0, -1.5, 0]} onSelect={() => {}} isSelected={false}/>
                        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />
                      </Canvas>
                  </Suspense>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{config.name}</h3>
                  <p className="text-xs text-green-300 font-semibold">{config.co2Reduction} kg CO₂ / year</p>
                </div>
                {selectedModel?.id === config.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="text-center mb-12">
           <h2 className="text-2xl font-bold mb-6 text-center text-green-300">2. Place in 3D or AR</h2>
           <div className="flex flex-wrap justify-center items-center gap-4">
              <button onClick={startAR} className="px-8 py-4 text-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full hover:scale-105 transform transition-transform duration-300 shadow-lg hover:shadow-green-500/40">
                  🎥 Start AR
              </button>
              <button onClick={addPlantToPreview} className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-full transition-colors duration-300">
                  Add to 3D Garden
              </button>
               {placedPlants.length > 0 && (
                  <button onClick={clearPlants} className="px-6 py-3 bg-red-600/80 hover:bg-red-700 text-white font-semibold rounded-full transition-colors duration-300">
                      Clear All
                  </button>
               )}
           </div>
        </section>

        {placedPlants.length > 0 && 
            <section className="mb-12 max-w-4xl mx-auto">
               <h2 className="text-2xl font-bold mb-4 text-center text-green-300">Your Total Impact</h2>
               <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-center p-6 rounded-2xl border border-green-400/30">
                 <p className="text-5xl font-bold text-white">{totalCo2Reduction} kg</p>
                 <p className="text-lg text-green-300">of CO₂ removed from the atmosphere per year</p>
               </div>
            </section>
        }

        <section className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center text-green-300">3D Garden Preview</h2>
          <div className="h-96 lg:h-[500px] rounded-xl overflow-hidden relative bg-gray-800">
             <Suspense fallback={loadingSpinner}>
                <Canvas camera={{ position: [5, 4, 10], fov: 50 }} shadows>
                    <Environment preset="forest" />
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]} receiveShadow>
                      <planeGeometry args={[50, 50]} />
                      <meshStandardMaterial color="#334422" roughness={0.8} />
                    </mesh>
                    {placedPlants.map(plant => (
                        <Plant key={plant.id} {...plant} onSelect={handleSelectPlantInPreview} isSelected={selectedPlantId === plant.id}/>
                    ))}
                    {placedPlants.length === 0 && selectedModel && (
                         <Plant id="preview" config={selectedModel} position={[0, -1.5, 0]} onSelect={() => {}} isSelected={true} />
                    )}
                    <OrbitControls />
                </Canvas>
             </Suspense>
             {placedPlants.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white/70 pointer-events-none">
                    <p className="text-lg">Your garden is empty.</p>
                    <p>Select a plant and add it to see its impact!</p>
                </div>
             )}
          </div>
        </section>
      </div>

      {isARActive && (
         <button onClick={stopAR} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-8 py-4 text-lg bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300">
           Exit AR Mode
         </button>
      )}
    </div>
  );
};


