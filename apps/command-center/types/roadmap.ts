export type WeekStatus = 'done' | 'current' | 'upcoming';

export interface RoadmapTask {
  task: string;
  done: boolean;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  status: WeekStatus;
  tasks: RoadmapTask[];
}
