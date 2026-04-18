'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, History, Home, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DayRecord, Task } from '@/lib/types'
import {
  getOrCreateTodayRecord,
  saveDayRecord,
  getAllDays,
  formatDate,
  getToday,
  addTask,
  toggleTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  addActivity,
  deleteActivity,
  getDayRecord,
  calculateStreak,
  StreakData,
} from '@/lib/store'
import { playSound, isSoundEnabled } from '@/lib/sounds'
import { ProductivityScore } from './productivity-score'
import { TaskItem } from './task-item'
import { ActivityItem } from './activity-item'
import { AddActivityDialog } from './add-activity-dialog'
import { Timeline } from './timeline'
import { DayDetail } from './day-detail'
import { ThemeToggle } from './theme-toggle'
import { StreakDisplay } from './streak-display'
import { Confetti } from './confetti'

type View = 'today' | 'history'

export function SilkyApp() {
  const [view, setView] = useState<View>('today')
  const [todayRecord, setTodayRecord] = useState<DayRecord | null>(null)
  const [allDays, setAllDays] = useState<DayRecord[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null)
  const [selectedDayRecord, setSelectedDayRecord] = useState<DayRecord | null>(null)
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, longestStreak: 0 })
  const [showCelebration, setShowCelebration] = useState(false)
  const [prevScore, setPrevScore] = useState(0)

  // Load data on mount
  useEffect(() => {
    const record = getOrCreateTodayRecord()
    setTodayRecord(record)
    setPrevScore(record.productivityScore)
    setAllDays(getAllDays())
    setStreakData(calculateStreak())
  }, [])

  // Check for score milestones
  useEffect(() => {
    if (!todayRecord) return
    const currentScore = todayRecord.productivityScore
    
    // Celebrate when hitting milestones
    const milestones = [25, 50, 75, 100]
    for (const milestone of milestones) {
      if (currentScore >= milestone && prevScore < milestone) {
        setShowCelebration(true)
        if (isSoundEnabled()) playSound('success')
        setTimeout(() => setShowCelebration(false), 2000)
        break
      }
    }
    setPrevScore(currentScore)
  }, [todayRecord?.productivityScore, prevScore, todayRecord])

  // Save and refresh data
  const saveAndRefresh = useCallback((record: DayRecord) => {
    saveDayRecord(record)
    setTodayRecord(record)
    setAllDays(getAllDays())
    setStreakData(calculateStreak())
  }, [])

  // Task handlers
  const handleAddTask = () => {
    if (newTaskTitle.trim() && todayRecord) {
      if (isSoundEnabled()) playSound('pop')
      const updated = addTask(todayRecord, newTaskTitle.trim())
      saveAndRefresh(updated)
      setNewTaskTitle('')
    }
  }

  const handleToggleTask = (taskId: string) => {
    if (todayRecord) {
      const updated = toggleTask(todayRecord, taskId)
      saveAndRefresh(updated)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    if (todayRecord) {
      const updated = deleteTask(todayRecord, taskId)
      saveAndRefresh(updated)
    }
  }

  const handleAddSubtask = (taskId: string, title: string) => {
    if (todayRecord) {
      const updated = addSubtask(todayRecord, taskId, title)
      saveAndRefresh(updated)
    }
  }

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    if (todayRecord) {
      const updated = toggleSubtask(todayRecord, taskId, subtaskId)
      saveAndRefresh(updated)
    }
  }

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    if (todayRecord) {
      const updated = deleteSubtask(todayRecord, taskId, subtaskId)
      saveAndRefresh(updated)
    }
  }

  const handleUpdateTimer = (taskId: string, timerData: Partial<Task>) => {
    if (todayRecord) {
      const updated = {
        ...todayRecord,
        tasks: todayRecord.tasks.map(task =>
          task.id === taskId ? { ...task, ...timerData } : task
        ),
      }
      saveAndRefresh(updated)
    }
  }

  // Activity handlers
  const handleAddActivity = (activity: Parameters<typeof addActivity>[1]) => {
    if (todayRecord) {
      if (isSoundEnabled()) playSound('pop')
      const updated = addActivity(todayRecord, activity)
      saveAndRefresh(updated)
    }
  }

  const handleDeleteActivity = (activityId: string) => {
    if (todayRecord) {
      const updated = deleteActivity(todayRecord, activityId)
      saveAndRefresh(updated)
    }
  }

  // History selection
  const handleSelectHistoryDate = (date: string) => {
    setSelectedHistoryDate(date)
    const record = getDayRecord(date)
    setSelectedDayRecord(record)
  }

  if (!todayRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Celebration confetti */}
      <Confetti active={showCelebration} />
      
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[100px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              silky
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-1">
              {view === 'today' ? formatDate(getToday()) : 'Your productivity journey'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant={view === 'today' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (isSoundEnabled()) playSound('click')
                setView('today')
              }}
              className="gap-2 silky-button cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Today
            </Button>
            <Button
              variant={view === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (isSoundEnabled()) playSound('click')
                setView('history')
                setSelectedHistoryDate(null)
                setSelectedDayRecord(null)
              }}
              className="gap-2 silky-button cursor-pointer"
            >
              <History className="w-4 h-4" />
              Timeline
            </Button>
          </div>
        </header>

        {view === 'today' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content - Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Streak display */}
              <StreakDisplay 
                currentStreak={streakData.currentStreak} 
                longestStreak={streakData.longestStreak} 
              />
              
              {/* Add task */}
              <div className="glass rounded-2xl p-4 silky-transition hover:shadow-lg">
                <div className="flex gap-3">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Add a task for today..."
                    className="bg-transparent border-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
                  />
                  <Button 
                    onClick={handleAddTask} 
                    size="sm" 
                    className="gap-2 silky-button cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Tasks list */}
              <div className="space-y-3">
                {todayRecord.tasks.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center animate-float">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tasks yet. Add one above to get started!</p>
                  </div>
                ) : (
                  todayRecord.tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTask(task.id)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onAddSubtask={(title) => handleAddSubtask(task.id, title)}
                      onToggleSubtask={(subtaskId) => handleToggleSubtask(task.id, subtaskId)}
                      onDeleteSubtask={(subtaskId) => handleDeleteSubtask(task.id, subtaskId)}
                      onUpdateTimer={(timerData) => handleUpdateTimer(task.id, timerData)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar - Score & Activities */}
            <div className="space-y-6">
              {/* Productivity Score */}
              <div className={`glass rounded-2xl p-6 flex flex-col items-center purple-glow silky-transition ${todayRecord.productivityScore >= 50 ? 'animate-score-pulse' : ''}`}>
                <ProductivityScore score={todayRecord.productivityScore} size="lg" />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {todayRecord.productivityScore >= 80
                    ? 'Outstanding work today!'
                    : todayRecord.productivityScore >= 60
                    ? 'Great progress!'
                    : todayRecord.productivityScore >= 40
                    ? 'Keep going!'
                    : todayRecord.productivityScore >= 20
                    ? 'Good start!'
                    : 'Start completing tasks'}
                </p>
              </div>

              {/* Activities */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Activities</h2>
                  <AddActivityDialog onAdd={handleAddActivity} />
                </div>
                <div className="space-y-3">
                  {todayRecord.activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Log activities to boost your score
                    </p>
                  ) : (
                    todayRecord.activities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        onDelete={() => handleDeleteActivity(activity.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Timeline View */
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-4 h-[500px]">
                <Timeline
                  days={allDays}
                  selectedDate={selectedHistoryDate}
                  onSelectDate={handleSelectHistoryDate}
                />
              </div>
            </div>
            <div>
              {/* Streak in timeline view */}
              <StreakDisplay 
                currentStreak={streakData.currentStreak} 
                longestStreak={streakData.longestStreak}
                className="mb-6"
              />
              
              {selectedDayRecord ? (
                <DayDetail
                  record={selectedDayRecord}
                  onClose={() => {
                    if (isSoundEnabled()) playSound('click')
                    setSelectedHistoryDate(null)
                    setSelectedDayRecord(null)
                  }}
                />
              ) : (
                <div className="glass rounded-2xl p-6 text-center animate-float">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a Day</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any node in the timeline to view details about that day
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
