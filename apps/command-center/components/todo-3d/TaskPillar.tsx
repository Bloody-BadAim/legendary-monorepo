'use client';

import { useRef, useState } from 'react';
import { useSpring, a } from '@react-spring/three';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { NotionTaskItem } from '@/types/notion';

const PRIORITY_HEIGHT: Record<string, number> = {
  'Critical Priority': 1.2,
  'High Priority': 1.0,
  'Medium Priority': 0.7,
  'Low Priority': 0.4,
};
const PRIORITY_COLOR: Record<string, string> = {
  'Critical Priority': '#dc2626',
  'High Priority': '#ef4444',
  'Medium Priority': '#f97316',
  'Low Priority': '#64748b',
};
const DONE_COLOR = '#10b981';
const DEFAULT_HEIGHT = 0.7;
const DEFAULT_COLOR = '#f97316';

interface TaskPillarProps {
  task: NotionTaskItem;
  position: [number, number, number];
}

export function TaskPillar({ task, position }: TaskPillarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const height = PRIORITY_HEIGHT[task.priority ?? ''] ?? DEFAULT_HEIGHT;
  const baseColor =
    task.status === 'Done'
      ? DONE_COLOR
      : (PRIORITY_COLOR[task.priority ?? ''] ?? DEFAULT_COLOR);
  const opacity = task.status === 'Done' ? 0.5 : 1;

  const { emissiveIntensity } = useSpring({
    emissiveIntensity: hovered ? 0.8 : 0,
    config: { tension: 200, friction: 20 },
  });

  const label =
    task.task.length > 30 ? task.task.slice(0, 27) + '...' : task.task;

  return (
    <group position={position}>
      <a.mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.25, height, 0.25]} />
        <a.meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
        />
      </a.mesh>
      {hovered && (
        <Html center={false} distanceFactor={8}>
          <div className="rounded-lg border border-slate-600 bg-slate-800/90 p-2 text-xs shadow-lg backdrop-blur-sm text-slate-200 whitespace-nowrap">
            <div className="font-medium">{label}</div>
            <div className="mt-0.5 text-slate-400">
              {task.priority ?? '—'} · {task.status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
