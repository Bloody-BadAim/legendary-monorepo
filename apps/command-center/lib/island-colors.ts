const ISLAND_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ef4444', // red
] as const;

export function getAreaColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ISLAND_COLORS[Math.abs(hash) % ISLAND_COLORS.length];
}
