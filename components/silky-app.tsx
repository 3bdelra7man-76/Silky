'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, History, Home, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
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
import { cn } from '@/lib/utils'

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
  // Mobile: score + streak panel collapsed by default to save space
  const [statsExpanded, setStatsExpanded] = useState(false)

  useEffect(() => {
    const record = getOrCreateTodayRecord()
    setTodayRecord(record)
    setPrevScore(record.productivityScore)
    setAllDays(getAllDays())
    setStreakData(calculateStreak())
  }, [])

  useEffect(() => {
    if (!todayRecord) return
    const currentScore = todayRecord.productivityScore
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

  const saveAndRefresh = useCallback((record: DayRecord) => {
    saveDayRecord(record)
    setTodayRecord(record)
    setAllDays(getAllDays())
    setStreakData(calculateStreak())
  }, [])

  const handleAddTask = () => {
    if (newTaskTitle.trim() && todayRecord) {
      if (isSoundEnabled()) playSound('pop')
      const updated = addTask(todayRecord, newTaskTitle.trim())
      saveAndRefresh(updated)
      setNewTaskTitle('')
    }
  }

  const handleToggleTask = (taskId: string) => {
    if (todayRecord) saveAndRefresh(toggleTask(todayRecord, taskId))
  }

  const handleDeleteTask = (taskId: string) => {
    if (todayRecord) saveAndRefresh(deleteTask(todayRecord, taskId))
  }

  const handleAddSubtask = (taskId: string, title: string) => {
    if (todayRecord) saveAndRefresh(addSubtask(todayRecord, taskId, title))
  }

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    if (todayRecord) saveAndRefresh(toggleSubtask(todayRecord, taskId, subtaskId))
  }

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    if (todayRecord) saveAndRefresh(deleteSubtask(todayRecord, taskId, subtaskId))
  }

  const handleUpdateTimer = (taskId: string, timerData: Partial<Task>) => {
    if (todayRecord) {
      saveAndRefresh({
        ...todayRecord,
        tasks: todayRecord.tasks.map(task =>
          task.id === taskId ? { ...task, ...timerData } : task
        ),
      })
    }
  }

  const handleAddActivity = (activity: Parameters<typeof addActivity>[1]) => {
    if (todayRecord) {
      if (isSoundEnabled()) playSound('pop')
      saveAndRefresh(addActivity(todayRecord, activity))
    }
  }

  const handleDeleteActivity = (activityId: string) => {
    if (todayRecord) saveAndRefresh(deleteActivity(todayRecord, activityId))
  }

  const handleSelectHistoryDate = (date: string) => {
    setSelectedHistoryDate(date)
    setSelectedDayRecord(getDayRecord(date))
  }

  const switchView = (v: View) => {
    if (isSoundEnabled()) playSound('click')
    setView(v)
    if (v === 'history') {
      setSelectedHistoryDate(null)
      setSelectedDayRecord(null)
    }
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
      <Confetti active={showCelebration} />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[100px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* ── Desktop layout: full sidebar ── */}
      <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Desktop header */}
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
              onClick={() => switchView('today')}
              className="gap-2 silky-button cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Today
            </Button>
            <Button
              variant={view === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => switchView('history')}
              className="gap-2 silky-button cursor-pointer"
            >
              <History className="w-4 h-4" />
              Timeline
            </Button>
          </div>
        </header>

        {view === 'today' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tasks column */}
            <div className="lg:col-span-2 space-y-6">
              <StreakDisplay currentStreak={streakData.currentStreak} longestStreak={streakData.longestStreak} />
              <div className="glass rounded-2xl p-4 silky-transition hover:shadow-lg">
                <div className="flex gap-3">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Add a task for today..."
                    className="bg-transparent border-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
                  />
                  <Button onClick={handleAddTask} size="sm" className="gap-2 silky-button cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>
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
            {/* Sidebar */}
            <div className="space-y-6">
              <div className={cn('glass rounded-2xl p-6 flex flex-col items-center purple-glow silky-transition', todayRecord.productivityScore >= 50 && 'animate-score-pulse')}>
                <ProductivityScore score={todayRecord.productivityScore} size="lg" />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {todayRecord.productivityScore >= 80 ? 'Outstanding work today!'
                    : todayRecord.productivityScore >= 60 ? 'Great progress!'
                    : todayRecord.productivityScore >= 40 ? 'Keep going!'
                    : todayRecord.productivityScore >= 20 ? 'Good start!'
                    : 'Start completing tasks'}
                </p>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Activities</h2>
                  <AddActivityDialog onAdd={handleAddActivity} />
                </div>
                <div className="space-y-3">
                  {todayRecord.activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Log activities to boost your score</p>
                  ) : (
                    todayRecord.activities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} onDelete={() => handleDeleteActivity(activity.id)} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-4 h-[500px]">
                <Timeline days={allDays} selectedDate={selectedHistoryDate} onSelectDate={handleSelectHistoryDate} />
              </div>
            </div>
            <div>
              <StreakDisplay currentStreak={streakData.currentStreak} longestStreak={streakData.longestStreak} className="mb-6" />
              {selectedDayRecord ? (
                <DayDetail record={selectedDayRecord} onClose={() => { if (isSoundEnabled()) playSound('click'); setSelectedHistoryDate(null); setSelectedDayRecord(null) }} />
              ) : (
                <div className="glass rounded-2xl p-6 text-center animate-float">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a Day</h3>
                  <p className="text-sm text-muted-foreground">Click on any node in the timeline to view details about that day</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile layout ── */}
      <div className="md:hidden relative z-10 flex flex-col min-h-screen pb-20">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 pt-6 pb-3">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-1.5">
            silky
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </h1>
          <ThemeToggle />
        </header>

        {/* Mobile date line */}
        <p className="text-xs text-muted-foreground px-4 mb-3">
          {view === 'today' ? formatDate(getToday()) : 'Your productivity journey'}
        </p>

        {/* ── TODAY ── */}
        {view === 'today' && (
          <div className="flex-1 px-4 space-y-4 overflow-y-auto">
            {/* Collapsible stats strip */}
            <button
              onClick={() => setStatsExpanded(p => !p)}
              className="w-full glass rounded-2xl px-4 py-3 flex items-center gap-3 silky-transition cursor-pointer"
            >
              {/* Mini score ring */}
              <ProductivityScore score={todayRecord.productivityScore} size="sm" showLabel={false} />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold leading-tight">
                  Score: {todayRecord.productivityScore}
                  <span className="text-muted-foreground font-normal">/100</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {streakData.currentStreak > 0
                    ? `${streakData.currentStreak}-day streak`
                    : 'Start your streak!'}
                </p>
              </div>
              {statsExpanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {/* Expanded stats */}
            {statsExpanded && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <StreakDisplay currentStreak={streakData.currentStreak} longestStreak={streakData.longestStreak} />
              </div>
            )}

            {/* Add task input */}
            <div className="glass rounded-2xl p-3">
              <div className="flex gap-2">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Add a task..."
                  className="bg-transparent border-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
                <Button onClick={handleAddTask} size="sm" className="gap-1 silky-button cursor-pointer shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {todayRecord.tasks.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center animate-float">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No tasks yet. Add one above!</p>
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

            {/* Activities */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">Activities</h2>
                <AddActivityDialog onAdd={handleAddActivity} />
              </div>
              <div className="space-y-2">
                {todayRecord.activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Log activities to boost your score</p>
                ) : (
                  todayRecord.activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} onDelete={() => handleDeleteActivity(activity.id)} />
                  ))
                )}
              </div>
            </div>

            {/* Bottom breathing room above nav */}
            <div className="h-2" />
          </div>
        )}

        {/* ── TIMELINE ── */}
        {view === 'history' && (
          <div className="flex-1 px-4 space-y-4 overflow-y-auto">
            <StreakDisplay currentStreak={streakData.currentStreak} longestStreak={streakData.longestStreak} />

            {/* Timeline SVG - fixed height on mobile */}
            <div className="glass rounded-2xl p-3 h-64">
              <Timeline
                days={allDays}
                selectedDate={selectedHistoryDate}
                onSelectDate={handleSelectHistoryDate}
              />
            </div>

            {/* Day detail slides in below the graph */}
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
              <div className="glass rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground">Tap a node to see that day&apos;s details</p>
              </div>
            )}
            <div className="h-2" />
          </div>
        )}

        {/* ── Mobile bottom navigation bar ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex">
          <div className="mx-4 mb-4 flex-1 glass rounded-2xl flex overflow-hidden shadow-lg border border-glass-border">
            <button
              onClick={() => switchView('today')}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 silky-transition cursor-pointer',
                view === 'today'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              )}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-medium">Today</span>
            </button>

            {/* Divider */}
            <div className="w-px bg-glass-border my-3" />

            <button
              onClick={() => switchView('history')}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 silky-transition cursor-pointer',
                view === 'history'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              )}
            >
              <History className="w-5 h-5" />
              <span className="text-xs font-medium">Timeline</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
