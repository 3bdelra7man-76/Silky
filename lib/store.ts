import { DayRecord, Task, SubTask, Activity } from './types'

const STORAGE_KEY = 'silky_data'

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  })
}

export function getAllDays(): DayRecord[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data) as DayRecord[]
  } catch {
    return []
  }
}

export function getDayRecord(date: string): DayRecord | null {
  const days = getAllDays()
  return days.find(d => d.date === date) || null
}

export function saveDayRecord(record: DayRecord): void {
  const days = getAllDays()
  const existingIndex = days.findIndex(d => d.date === record.date)
  
  // Recalculate productivity score
  record.productivityScore = calculateProductivityScore(record)
  
  if (existingIndex >= 0) {
    days[existingIndex] = record
  } else {
    days.push(record)
  }
  
  // Sort by date descending
  days.sort((a, b) => b.date.localeCompare(a.date))
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days))
}

export function getOrCreateTodayRecord(): DayRecord {
  const today = getToday()
  const existing = getDayRecord(today)
  if (existing) return existing
  
  const newRecord: DayRecord = {
    date: today,
    tasks: [],
    activities: [],
    productivityScore: 0,
  }
  return newRecord
}

export function calculateProductivityScore(record: DayRecord): number {
  let score = 0
  const maxScore = 100
  
  // Tasks completion (up to 50 points)
  const totalTasks = record.tasks.length
  if (totalTasks > 0) {
    const completedTasks = record.tasks.filter(t => t.completed).length
    const taskScore = (completedTasks / totalTasks) * 40
    
    // Subtask bonus (up to 10 points)
    let subtaskScore = 0
    record.tasks.forEach(task => {
      if (task.subtasks.length > 0) {
        const completedSubs = task.subtasks.filter(s => s.completed).length
        subtaskScore += (completedSubs / task.subtasks.length) * 2
      }
    })
    subtaskScore = Math.min(subtaskScore, 10)
    
    score += taskScore + subtaskScore
  }
  
  // Activities (up to 50 points)
  const activityPoints: Record<string, number> = {
    learning: 15,
    reading: 12,
    exercise: 12,
    habit: 8,
    other: 5,
  }
  
  let activityScore = 0
  record.activities.forEach(activity => {
    activityScore += activityPoints[activity.type] || 5
    // Duration bonus
    if (activity.duration) {
      activityScore += Math.min(activity.duration / 30, 3) // up to 3 bonus points per activity
    }
  })
  score += Math.min(activityScore, 50)
  
  return Math.min(Math.round(score), maxScore)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Task helpers
export function addTask(record: DayRecord, title: string): DayRecord {
  const task: Task = {
    id: generateId(),
    title,
    completed: false,
    subtasks: [],
    createdAt: new Date().toISOString(),
  }
  return { ...record, tasks: [...record.tasks, task] }
}

export function toggleTask(record: DayRecord, taskId: string): DayRecord {
  const tasks = record.tasks.map(task => {
    if (task.id === taskId) {
      const completed = !task.completed
      return {
        ...task,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
        subtasks: completed ? task.subtasks.map(s => ({ ...s, completed: true })) : task.subtasks,
      }
    }
    return task
  })
  return { ...record, tasks }
}

export function deleteTask(record: DayRecord, taskId: string): DayRecord {
  return { ...record, tasks: record.tasks.filter(t => t.id !== taskId) }
}

export function addSubtask(record: DayRecord, taskId: string, title: string): DayRecord {
  const subtask: SubTask = {
    id: generateId(),
    title,
    completed: false,
  }
  const tasks = record.tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, subtasks: [...task.subtasks, subtask] }
    }
    return task
  })
  return { ...record, tasks }
}

export function toggleSubtask(record: DayRecord, taskId: string, subtaskId: string): DayRecord {
  const tasks = record.tasks.map(task => {
    if (task.id === taskId) {
      const subtasks = task.subtasks.map(sub => {
        if (sub.id === subtaskId) {
          return { ...sub, completed: !sub.completed }
        }
        return sub
      })
      // Check if all subtasks are complete
      const allComplete = subtasks.length > 0 && subtasks.every(s => s.completed)
      return { 
        ...task, 
        subtasks,
        completed: allComplete ? true : task.completed,
        completedAt: allComplete && !task.completed ? new Date().toISOString() : task.completedAt,
      }
    }
    return task
  })
  return { ...record, tasks }
}

export function deleteSubtask(record: DayRecord, taskId: string, subtaskId: string): DayRecord {
  const tasks = record.tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, subtasks: task.subtasks.filter(s => s.id !== subtaskId) }
    }
    return task
  })
  return { ...record, tasks }
}

// Activity helpers
export function addActivity(record: DayRecord, activity: Omit<Activity, 'id' | 'createdAt'>): DayRecord {
  const newActivity: Activity = {
    ...activity,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  return { ...record, activities: [...record.activities, newActivity] }
}

export function deleteActivity(record: DayRecord, activityId: string): DayRecord {
  return { ...record, activities: record.activities.filter(a => a.id !== activityId) }
}

// Streak calculation
export interface StreakData {
  currentStreak: number
  longestStreak: number
}

export function calculateStreak(): StreakData {
  const days = getAllDays()
  if (days.length === 0) return { currentStreak: 0, longestStreak: 0 }

  // Sort by date descending (newest first)
  const sortedDays = [...days].sort((a, b) => b.date.localeCompare(a.date))
  
  // A day is "productive" if it has a score >= 30 (did something meaningful)
  const isProductiveDay = (record: DayRecord) => record.productivityScore >= 30
  
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  
  const today = getToday()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  // Check if today or yesterday was productive (streak is still active)
  const todayRecord = sortedDays.find(d => d.date === today)
  const yesterdayRecord = sortedDays.find(d => d.date === yesterdayStr)
  
  const streakActive = 
    (todayRecord && isProductiveDay(todayRecord)) ||
    (yesterdayRecord && isProductiveDay(yesterdayRecord))
  
  if (!streakActive) {
    // Calculate longest streak only
    let streak = 0
    for (let i = 0; i < sortedDays.length; i++) {
      if (isProductiveDay(sortedDays[i])) {
        streak++
        // Check if next day is consecutive
        if (i + 1 < sortedDays.length) {
          const currentDate = new Date(sortedDays[i].date)
          const nextDate = new Date(sortedDays[i + 1].date)
          const diffDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays > 1) {
            longestStreak = Math.max(longestStreak, streak)
            streak = 0
          }
        }
      } else {
        longestStreak = Math.max(longestStreak, streak)
        streak = 0
      }
    }
    longestStreak = Math.max(longestStreak, streak)
    return { currentStreak: 0, longestStreak }
  }
  
  // Calculate current streak
  let expectedDate = todayRecord && isProductiveDay(todayRecord) ? today : yesterdayStr
  
  for (const day of sortedDays) {
    if (day.date !== expectedDate) continue
    
    if (isProductiveDay(day)) {
      currentStreak++
      tempStreak++
      
      // Move to previous day
      const prevDate = new Date(expectedDate)
      prevDate.setDate(prevDate.getDate() - 1)
      expectedDate = prevDate.toISOString().split('T')[0]
    } else {
      break
    }
  }
  
  // Calculate longest streak from all days
  tempStreak = 0
  for (let i = 0; i < sortedDays.length; i++) {
    if (isProductiveDay(sortedDays[i])) {
      tempStreak++
      if (i + 1 < sortedDays.length) {
        const currentDate = new Date(sortedDays[i].date)
        const nextDate = new Date(sortedDays[i + 1].date)
        const diffDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays > 1) {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 0
        }
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 0
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)
  
  return { currentStreak, longestStreak }
}

// Get common activities between days (for timeline connections)
export function getCommonActivities(day1: DayRecord, day2: DayRecord): string[] {
  const types1 = new Set(day1.activities.map(a => a.type))
  const types2 = new Set(day2.activities.map(a => a.type))
  return Array.from(types1).filter(type => types2.has(type))
}
