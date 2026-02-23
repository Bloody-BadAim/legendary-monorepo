export interface InfraNode {
  id: string;
  label: string;
  sub: string;
  color: string;
  icon: string;
  x: number;
  y: number;
  /** Optional pixel position override (used when persisting browser-adjusted layout) */
  xPx?: number;
  yPx?: number;
  domains?: string[];
  specs?: string;
  services?: string[];
  status?: 'pending';
}

export interface InfraConnection {
  from: string;
  to: string;
  label: string;
  color: string;
  dashed?: boolean;
}
