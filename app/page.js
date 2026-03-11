"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF, Html } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

function Model({ path, id, otherPosition, setCurrentPosition, rotation: externalRotation, isSelected, onSelect }) {
  const { scene } = useGLTF(path);
  const groupRef = useRef();
  
  const [position, setPosition] = useState([0, 0, 0]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Učitavanje pozicije iz Firebase
  useEffect(() => {
    const loadModelData = async () => {
      try {
        const ref = doc(db, "models", id);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = snap.data();
          const pos = [data.positionX || 0, 0, 0];
          setPosition(pos);
          setCurrentPosition(pos);
          setRotation([0, data.rotationY || 0, 0]);
          setIsLoaded(true);
          console.log(`Model ${id} loaded at:`, pos[0]);
        }
      } catch (error) {
        console.error("Error loading model data:", error);
        setIsLoaded(true);
      }
    };
    
    loadModelData();
  }, [id, setCurrentPosition]);

  // Sinhronizacija rotacije
  useEffect(() => {
    if (externalRotation !== undefined && isLoaded) {
      setRotation([0, externalRotation, 0]);
    }
  }, [externalRotation, isLoaded]);

  // Spremanje u Firebase
  const saveToFirebase = async (pos, rot) => {
    try {
      const ref = doc(db, "models", id);
      await updateDoc(ref, {
        positionX: pos[0],
        rotationY: rot[1]
      });
      console.log(`Model ${id} saved:`, pos[0]);
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }
  };

  // Provjera kolizije
  const checkCollision = (newPos) => {
    if (!otherPosition) return false;
    
    const dx = Math.abs(newPos[0] - otherPosition[0]);
    return dx < 2.5;
  };

  // Handleri za drag
  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    onSelect?.(id);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    saveToFirebase(position, rotation);
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    
    const { x } = e.point;
    const newPos = [x, 0, 0];
    
    if (!checkCollision(newPos)) {
      setPosition(newPos);
      setCurrentPosition(newPos);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onPointerDown={handleDragStart}
      onPointerUp={handleDragEnd}
      onPointerMove={handleDrag}
    >
      <primitive 
        object={scene} 
        scale={1}
        onClick={() => onSelect?.(id)}
      />
      
      {isSelected && (
        <Html position={[0, 2.5, 0]} center>
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            Odabran
          </div>
        </Html>
      )}
      
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export default function Home() {
  const [topView, setTopView] = useState(false);
  const [model1Pos, setModel1Pos] = useState([-2, 0, 0]);
  const [model2Pos, setModel2Pos] = useState([2, 0, 0]);
  const [model1Rot, setModel1Rot] = useState(0);
  const [model2Rot, setModel2Rot] = useState(0);
  const [selectedModel, setSelectedModel] = useState("model1");
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Inicijalizacija Firebase
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        console.log("Inicijalizacija Firebase...");
        
        // Model 1
        const ref1 = doc(db, "models", "model1");
        const snap1 = await getDoc(ref1);
        if (!snap1.exists()) {
          await setDoc(ref1, {
            positionX: -2,
            positionY: 0,
            positionZ: 0,
            rotationY: 0
          });
          console.log("Model1 dokument kreiran");
        } else {
          setModel1Rot(snap1.data().rotationY || 0);
          setModel1Pos([snap1.data().positionX || -2, 0, 0]);
        }
        
        // Model 2
        const ref2 = doc(db, "models", "model2");
        const snap2 = await getDoc(ref2);
        if (!snap2.exists()) {
          await setDoc(ref2, {
            positionX: 2,
            positionY: 0,
            positionZ: 0,
            rotationY: 0
          });
          console.log("Model2 dokument kreiran");
        } else {
          setModel2Rot(snap2.data().rotationY || 0);
          setModel2Pos([snap2.data().positionX || 2, 0, 0]);
        }
        
        setFirebaseReady(true);
        setIsLoading(false);
        console.log("Firebase inicijalizacija završena");
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        setFirebaseReady(true);
        setIsLoading(false);
      }
    };
    
    initializeFirebase();
  }, []);

  const rotateSelectedModel = async (value) => {
    if (selectedModel === "model1") {
      setModel1Rot(value);
      try {
        const ref = doc(db, "models", "model1");
        await updateDoc(ref, { rotationY: value });
        console.log("Model1 rotacija sačuvana:", value);
      } catch (error) {
        console.error("Error saving rotation:", error);
      }
    } else if (selectedModel === "model2") {
      setModel2Rot(value);
      try {
        const ref = doc(db, "models", "model2");
        await updateDoc(ref, { rotationY: value });
        console.log("Model2 rotacija sačuvana:", value);
      } catch (error) {
        console.error("Error saving rotation:", error);
      }
    }
  };

  const toggleView = () => {
    setTopView(!topView);
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-xl bg-white p-4 rounded shadow-lg">
          Učitavanje modela...
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative">
      {/* UI Kontrole */}
      <div className="absolute top-4 left-4 z-10 space-y-4 bg-white p-4 rounded-lg shadow-xl">
        <button
          className={`px-4 py-2 rounded transition ${
            topView 
              ? "bg-green-500 hover:bg-green-600" 
              : "bg-blue-500 hover:bg-blue-600"
          } text-white font-semibold`}
          onClick={toggleView}
        >
          {topView ? "3D Prikaz" : "2D Prikaz (Pogled odozgo)"}
        </button>
        
        <div className="border-t pt-3">
          <div className="mb-3">
            <p className="font-medium mb-1">Odabrani model:</p>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded ${
                  selectedModel === "model1" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedModel("model1")}
              >
                Model 1
              </button>
              <button
                className={`px-3 py-1 rounded ${
                  selectedModel === "model2" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedModel("model2")}
              >
                Model 2
              </button>
            </div>
          </div>
          
          <p className="font-medium mb-2">
            Rotacija {selectedModel === "model1" ? "Modela 1" : "Modela 2"}
          </p>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.1"
            value={selectedModel === "model1" ? model1Rot : model2Rot}
            onChange={(e) => rotateSelectedModel(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-1">
            Vrijednost: {((selectedModel === "model1" ? model1Rot : model2Rot) * 180 / Math.PI).toFixed(0)}°
          </p>
        </div>
        
        <div className="text-sm bg-gray-50 p-2 rounded">
          <p className="font-medium">Pozicije:</p>
          <p>Model 1: X = {model1Pos[0].toFixed(2)}</p>
          <p>Model 2: X = {model2Pos[0].toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Z = 0 (fiksno)</p>
        </div>
      </div>

      {/* 3D Canvas */}
      {firebaseReady && (
        <Canvas
          shadows
          camera={{ 
            position: topView ? [0, 15, 0] : [8, 5, 8],
            fov: 50,
            near: 0.1,
            far: 1000
          }}
          onPointerMissed={() => setSelectedModel(null)}
          style={{ background: '#111' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1.2} 
            castShadow 
            shadow-mapSize-width={1024} 
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-5, 5, 5]} intensity={0.7} />
          <directionalLight position={[0, 5, -5]} intensity={0.5} />
          
          <Grid 
            args={[20, 20]} 
            cellSize={1} 
            cellThickness={0.5} 
            cellColor="#6b7280"
            sectionSize={3}
            sectionThickness={1}
            sectionColor="#9ca3af"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
          />
          
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.01, 0]} 
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
          
          {/* Model 1 - koristi model1.glb */}
          <Model
            path="/models/model1.glb"
            id="model1"
            otherPosition={model2Pos}
            setCurrentPosition={setModel1Pos}
            rotation={model1Rot}
            isSelected={selectedModel === "model1"}
            onSelect={setSelectedModel}
          />
          
          {/* Model 2 - koristi model2.glb */}
          <Model
            path="/models/model2.glb"
            id="model2"
            otherPosition={model1Pos}
            setCurrentPosition={setModel2Pos}
            rotation={model2Rot}
            isSelected={selectedModel === "model2"}
            onSelect={setSelectedModel}
          />
          
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            enableRotate={!topView}
            maxPolarAngle={topView ? 0.1 : Math.PI / 2}
            minDistance={topView ? 10 : 3}
            maxDistance={topView ? 30 : 20}
            target={[0, 0, 0]}
          />
        </Canvas>
      )}
      
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 text-xs">
        <p>Model 1: X = {model1Pos[0].toFixed(2)}</p>
        <p>Model 2: X = {model2Pos[0].toFixed(2)}</p>
        <p>Razmak: {Math.abs(model1Pos[0] - model2Pos[0]).toFixed(2)}</p>
      </div>
    </div>
  );
}