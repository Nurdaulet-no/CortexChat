// src/components/RotatingElement3D.jsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei';

function SceneContent() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <Icosahedron ref={meshRef} args={[1, 0]} scale={1.2}>
        {/* MeshDistortMaterial gives a nice organic, blobby look */}
        <MeshDistortMaterial
          color="#8A2BE2" // A nice purple
          attach="material"
          distort={0.45} // Strength of the distortion
          speed={1.5}   // Speed of the distortion
          roughness={0.1}
          metalness={0.1}
        />
      </Icosahedron>
    </>
  );
}

const RotatingElement3D = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '15%', // Adjust positioning as desired
      left: '50%',
      transform: 'translateX(-50%)',
      width: '150px', // Container size for the canvas
      height: '150px',
      zIndex: 2, // Above Vanta and cursor particles, but could be below main text
      pointerEvents: 'none', // Allow clicks to pass through
    }}>
      <Canvas>
        <SceneContent />
      </Canvas>
    </div>
  );
};

export default RotatingElement3D;