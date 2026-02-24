export type WeekStatus = 'done' | 'current' | 'upcoming';

export interface RoadmapTask {
  task: string;
  done: boolean;
  note?: string;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  status: WeekStatus;
  focus: string;
  tasks: RoadmapTask[];
}
