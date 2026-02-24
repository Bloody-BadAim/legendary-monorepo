'use client';

import { Billboard, Html } from '@react-three/drei';

interface IslandLabelProps {
  text: string;
  taskCount: number;
}

export function IslandLabel({ text, taskCount }: IslandLabelProps) {
  return (
    <Billboard position={[0, 3.5, 0]} follow={true}>
      <Html center={false} distanceFactor={8}>
        <div
          className="text-center font-medium text-white"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          <div className="whitespace-nowrap text-sm">{text}</div>
          <div className="mt-0.5 text-xs text-slate-400">{taskCount} taken</div>
        </div>
      </Html>
    </Billboard>
  );
}
