
import { Task, Template } from './types';

export const generateMockTasks = (day: number): Task[] => [
  {
    id: `day-${day}-task-1`,
    time: "09:00 AM",
    message: `Good morning Interns! Welcome to Day ${day} tasks. Please review your objectives.`,
    mediaName: `Day_${day}_Intro_Image.png`,
    isDone: false,
    type: 'media'
  },
  {
    id: `day-${day}-task-2`,
    time: "12:30 PM",
    message: `Mid-day check-in. Don't forget to submit your progress reports for the morning session.`,
    mediaName: `Checklist_D${day}.pdf`,
    isDone: false,
    type: 'media'
  },
  {
    id: `day-${day}-task-3`,
    time: "05:00 PM",
    message: `End of day recap. Please fill out your attendance logs.`,
    mediaName: ``,
    isDone: false,
    type: 'text'
  }
];

export const DEFAULT_SCHEDULE: Record<number, Task[]> = Array.from({ length: 14 }, (_, i) => i + 1)
  .reduce((acc, day) => ({ ...acc, [day]: generateMockTasks(day) }), {});

export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'default-14-day',
    name: 'Standard 14-Day Onboarding',
    schedule: DEFAULT_SCHEDULE
  }
];

export const STORAGE_KEY = 'INTERN_TRACK_APP_DATA';
export const TEMPLATES_KEY = 'INTERN_TRACK_TEMPLATES';
