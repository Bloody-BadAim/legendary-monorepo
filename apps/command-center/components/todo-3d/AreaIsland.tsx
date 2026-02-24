'use client';

import { useSpring, a } from '@react-spring/three';
import { Float } from '@react-three/drei';
import { getAreaColor } from '@/lib/island-colors';
import { TaskPillar } from './TaskPillar';
import { IslandLabel } from './IslandLabel';
import type { NotionAreaItem } from '@/types/notion';
import type { NotionTaskItem } from '@/types/notion';

const TASK_RADIUS = 2;
const MAX_TASKS = 8;

interface AreaIslandProps {
  area: NotionAreaItem;
  tasks: NotionTaskItem[];
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}

function sortTasksForDisplay(tasks: NotionTaskItem[]): NotionTaskItem[] {
  const notDone = tasks.filter((t) => t.status !== 'Done');
  const done = tasks.filter((t) => t.status === 'Done');
  return [...notDone, ...done].slice(0, MAX_TASKS);
}

const ROCK_POSITIONS: [number, number, number][] = [
  [0.8, 0.5, 0.6],
  [-0.9, 0.45, -0.5],
  [0.4, 0.55, -0.9],
];

export function AreaIsland({
  area,
  tasks,
  position,
  isSelected,
  onClick,
}: AreaIslandProps) {
  const color = getAreaColor(area.name);
  const displayTasks = sortTasksForDisplay(tasks);

  const { scale } = useSpring({
    scale: isSelected ? 1.15 : 1,
    config: { tension: 300, friction: 30 },
  });

  return (
    <a.group
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <group>
          {/* Island base */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3, 4, 0.8, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Grass top */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.1, 3, 0.3, 8]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          {/* Rocks */}
          {ROCK_POSITIONS.map((pos, i) => (
            <mesh key={i} position={pos}>
              <dodecahedronGeometry args={[0.3]} />
              <meshStandardMaterial color="#64748b" />
            </mesh>
          ))}
        </group>
      </Float>

      {/* Task pillars in circle */}
      {displayTasks.map((task, i) => {
        const count = displayTasks.length;
        const angle = (i / count) * Math.PI * 2;
        const x = TASK_RADIUS * Math.cos(angle);
        const z = TASK_RADIUS * Math.sin(angle);
        return <TaskPillar key={task.id} task={task} position={[x, 0.6, z]} />;
      })}

      <IslandLabel text={area.name} taskCount={tasks.length} />
    </a.group>
  );
}
