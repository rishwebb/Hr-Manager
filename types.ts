
export interface Task {
  id: string;
  time: string; // Format: "HH:mm AM/PM"
  message: string;
  mediaName: string;
  isDone: boolean;
  type: 'text' | 'media';
}

export interface Template {
  id: string;
  name: string;
  schedule: Record<number, Task[]>;
}

export interface Batch {
  id: string;
  name: string;
  whatsappLink: string;
  startDate: string; // ISO String
  schedule: Record<number, Task[]>; // Key is day 1-14
  isRecording: boolean;
  templateName?: string;
}

export enum TaskStatus {
  COMPLETED = 'GREEN',
  OVERDUE = 'RED',
  UPCOMING = 'YELLOW'
}

export interface AppState {
  batches: Batch[];
  templates: Template[];
  downloadDirectory: string | null;
}
