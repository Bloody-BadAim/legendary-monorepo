export type InfraStatus = 'live' | 'pending' | 'dev';

export interface InfraNode {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  status: InfraStatus;
  specs?: string;
  ip?: string;
  services: string[];
  domains?: string[];
  ports?: string[];
}

export interface InfraConnection {
  from: string;
  to: string;
  label: string;
  type: 'https' | 'tunnel' | 'internal';
}
