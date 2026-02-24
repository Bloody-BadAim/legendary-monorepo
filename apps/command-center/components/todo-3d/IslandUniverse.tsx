'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloatingParticles } from './FloatingParticles';
import { AreaIsland } from './AreaIsland';
import type { NotionAreaItem } from '@/types/notion';
import type { NotionTaskItem } from '@/types/notion';

const RADIUS = 10;

interface IslandUniverseProps {
  areas: NotionAreaItem[];
  tasks: NotionTaskItem[];
  projects: { id: string; areaIds: string[] }[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string | null) => void;
}

function getTasksForArea(
  areaId: string,
  allTasks: NotionTaskItem[],
  projects: { id: string; areaIds: string[] }[]
): NotionTaskItem[] {
  const projectIdsInArea = new Set(
    projects.filter((p) => p.areaIds.includes(areaId)).map((p) => p.id)
  );

  if (projectIdsInArea.size === 0) {
    return [];
  }

  return allTasks.filter(
    (t) =>
      t.projectIds.length > 0 &&
      t.projectIds.some((pid) => projectIdsInArea.has(pid))
  );
}

function IslandUniverseScene({
  areas,
  tasks,
  projects,
  selectedAreaId,
  onSelectArea,
}: IslandUniverseProps) {
  const total = areas.length;
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 20, 10]} intensity={1.5} color="#8b5cf6" />
      <pointLight position={[-10, 15, -5]} intensity={1} color="#06b6d4" />
      <FloatingParticles />
      {areas.map((area, index) => {
        const angle = (index / total) * Math.PI * 2;
        const x = RADIUS * Math.cos(angle);
        const z = RADIUS * Math.sin(angle);
        const areaTasks = getTasksForArea(area.id, tasks, projects);
        return (
          <AreaIsland
            key={area.id}
            area={area}
            tasks={areaTasks}
            position={[x, -1, z]}
            isSelected={selectedAreaId === area.id}
            onClick={() =>
              onSelectArea(selectedAreaId === area.id ? null : area.id)
            }
          />
        );
      })}
    </>
  );
}

export function IslandUniverse(props: IslandUniverseProps) {
  return (
    <div className="h-full min-h-[600px] w-full bg-[#0a0f1e]">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60 }}
        frameloop="always"
        gl={{ antialias: true }}
      >
        <OrbitControls
          target={[0, 0, 0]}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          enableDamping
          dampingFactor={0.05}
        />
        <Suspense fallback={null}>
          <IslandUniverseScene {...props} />
          {props.areas.length === 0 && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[2, 16, 16]} />
              <meshStandardMaterial color="#8b5cf6" />
            </mesh>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
