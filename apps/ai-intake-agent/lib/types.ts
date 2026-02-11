export interface FormData {
  name: string;
  email: string;
  company: string;
  questionType: string;
  description: string;
}

export interface AIResponse {
  category: 'automation' | 'ai-integration' | 'consulting' | 'other';
  urgency: number;
  summary: string;
}
