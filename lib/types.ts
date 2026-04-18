export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  completed: boolean
  subtasks: SubTask[]
  createdAt: string
  completedAt?: string
  // Timer support
  hasTimer?: boolean
  timerDuration?: number // in seconds
  timerElapsed?: number // in seconds
  timerStartedAt?: string // ISO timestamp when timer was started
}

export interface Activity {
  id: string
  type: 'learning' | 'reading' | 'exercise' | 'habit' | 'other'
  title: string
  description?: string
  duration?: number // in minutes
  createdAt: string
}

export interface DayRecord {
  date: string // YYYY-MM-DD
  tasks: Task[]
  activities: Activity[]
  productivityScore: number // 0-100
  notes?: string
}

export type ActivityType = Activity['type']

export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'learning', label: 'Learning', icon: 'brain' },
  { value: 'reading', label: 'Reading', icon: 'book' },
  { value: 'exercise', label: 'Exercise', icon: 'dumbbell' },
  { value: 'habit', label: 'Habit', icon: 'repeat' },
  { value: 'other', label: 'Other', icon: 'star' },
]
