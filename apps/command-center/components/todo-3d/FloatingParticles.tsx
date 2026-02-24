'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 200;
const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#3b82f6'];
const RANGE = 50;

export function FloatingParticles() {
  const groupRef = useRef<THREE.Group>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2 * RANGE;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2 * RANGE;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * RANGE;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <mesh
          key={i}
          position={[
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2],
          ]}
        >
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshBasicMaterial
            color={new THREE.Color(COLORS[i % COLORS.length])}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
