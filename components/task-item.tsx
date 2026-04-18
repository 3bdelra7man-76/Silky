'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, Plus, Trash2, ChevronDown, ChevronRight, Clock, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { playSound, isSoundEnabled } from '@/lib/sounds'
import { MiniConfetti } from './confetti'

interface TaskItemProps {
  task: Task
  onToggle: () => void
  onDelete: () => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (subtaskId: string) => void
  onDeleteSubtask: (subtaskId: string) => void
  onUpdateTimer?: (timerData: { hasTimer?: boolean; timerDuration?: number; timerElapsed?: number; timerStartedAt?: string }) => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateTimer,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true)
  const [newSubtask, setNewSubtask] = useState('')
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 })
  const checkboxRef = useRef<HTMLButtonElement>(null)
  
  // Timer state
  const [showTimerSetup, setShowTimerSetup] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState('25')
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(task.timerElapsed || 0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const completedSubtasks = task.subtasks.filter(s => s.completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  // Timer logic
  useEffect(() => {
    if (task.timerStartedAt && !task.completed) {
      const startTime = new Date(task.timerStartedAt).getTime()
      const now = Date.now()
      const elapsedSinceStart = Math.floor((now - startTime) / 1000)
      setElapsed((task.timerElapsed || 0) + elapsedSinceStart)
      setTimerRunning(true)
    }
  }, [task.timerStartedAt, task.timerElapsed, task.completed])

  useEffect(() => {
    if (timerRunning && !task.completed) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning, task.completed])

  const startTimer = useCallback(() => {
    if (isSoundEnabled()) playSound('click')
    setTimerRunning(true)
    onUpdateTimer?.({ timerStartedAt: new Date().toISOString(), timerElapsed: elapsed })
  }, [elapsed, onUpdateTimer])

  const pauseTimer = useCallback(() => {
    if (isSoundEnabled()) playSound('click')
    setTimerRunning(false)
    onUpdateTimer?.({ timerStartedAt: undefined, timerElapsed: elapsed })
  }, [elapsed, onUpdateTimer])

  const resetTimer = useCallback(() => {
    if (isSoundEnabled()) playSound('pop')
    setTimerRunning(false)
    setElapsed(0)
    onUpdateTimer?.({ timerStartedAt: undefined, timerElapsed: 0 })
  }, [onUpdateTimer])

  const enableTimer = useCallback(() => {
    if (isSoundEnabled()) playSound('pop')
    const duration = parseInt(timerMinutes) * 60 || 25 * 60
    onUpdateTimer?.({ hasTimer: true, timerDuration: duration, timerElapsed: 0 })
    setShowTimerSetup(false)
  }, [timerMinutes, onUpdateTimer])

  const handleToggle = () => {
    if (!task.completed) {
      // Completing the task
      if (isSoundEnabled()) playSound('complete')
      setJustCompleted(true)
      
      // Get checkbox position for confetti
      if (checkboxRef.current) {
        const rect = checkboxRef.current.getBoundingClientRect()
        setConfettiPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 600)
      }
      
      setTimeout(() => setJustCompleted(false), 600)
    } else {
      if (isSoundEnabled()) playSound('toggle')
    }
    onToggle()
  }

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      if (isSoundEnabled()) playSound('pop')
      onAddSubtask(newSubtask.trim())
      setNewSubtask('')
      setShowAddSubtask(false)
    }
  }

  const handleToggleSubtask = (subtaskId: string) => {
    const subtask = task.subtasks.find(s => s.id === subtaskId)
    if (subtask && !subtask.completed) {
      if (isSoundEnabled()) playSound('complete')
    } else {
      if (isSoundEnabled()) playSound('toggle')
    }
    onToggleSubtask(subtaskId)
  }

  const timerProgress = task.timerDuration ? Math.min((elapsed / task.timerDuration) * 100, 100) : 0
  const timerComplete = task.timerDuration && elapsed >= task.timerDuration

  return (
    <div 
      className={cn(
        'glass rounded-xl p-4 silky-transition glass-hover',
        justCompleted && 'animate-task-complete'
      )}
    >
      <MiniConfetti active={showConfetti} x={confettiPosition.x} y={confettiPosition.y} />
      
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          ref={checkboxRef}
          onClick={handleToggle}
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center silky-transition flex-shrink-0 mt-0.5 cursor-pointer hover:scale-110',
            task.completed
              ? 'bg-primary border-primary'
              : 'border-border hover:border-primary hover:bg-primary/10'
          )}
        >
          {task.completed && (
            <Check className={cn('w-3 h-3 text-primary-foreground', justCompleted && 'animate-checkmark')} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Task title and actions */}
          <div className="flex items-center gap-2">
            {totalSubtasks > 0 && (
              <button
                onClick={() => {
                  if (isSoundEnabled()) playSound('click')
                  setExpanded(!expanded)
                }}
                className="text-muted-foreground hover:text-foreground silky-transition cursor-pointer hover:scale-110"
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            <span
              className={cn(
                'font-medium silky-transition flex-1',
                task.completed && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </span>
            
            {/* Timer indicator */}
            {task.hasTimer && (
              <span className={cn(
                'text-xs font-mono px-2 py-0.5 rounded-full',
                timerComplete 
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : timerRunning 
                    ? 'bg-primary/20 text-primary timer-active'
                    : 'bg-muted text-muted-foreground'
              )}>
                {formatTime(elapsed)}
              </span>
            )}
            
            {!task.hasTimer && !task.completed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isSoundEnabled()) playSound('click')
                  setShowTimerSetup(!showTimerSetup)
                }}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer hover:scale-110 silky-transition"
                title="Add timer"
              >
                <Clock className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isSoundEnabled()) playSound('click')
                setShowAddSubtask(!showAddSubtask)
              }}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer hover:scale-110 silky-transition"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isSoundEnabled()) playSound('click')
                onDelete()
              }}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer hover:scale-110 silky-transition"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Timer setup */}
          {showTimerSetup && (
            <div className="flex items-center gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
              <Input
                type="number"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(e.target.value)}
                placeholder="25"
                className="h-8 w-20 text-sm bg-secondary/50"
              />
              <span className="text-xs text-muted-foreground">min</span>
              <Button size="sm" onClick={enableTimer} className="h-8 silky-button cursor-pointer">
                Set Timer
              </Button>
            </div>
          )}

          {/* Timer controls */}
          {task.hasTimer && !task.completed && (
            <div className="flex items-center gap-2 mt-2">
              {timerRunning ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pauseTimer}
                  className="h-7 gap-1 text-xs cursor-pointer hover:scale-105 silky-transition"
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTimer}
                  className="h-7 gap-1 text-xs cursor-pointer hover:scale-105 silky-transition"
                >
                  <Play className="w-3 h-3" />
                  {elapsed > 0 ? 'Resume' : 'Start'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetTimer}
                className="h-7 gap-1 text-xs text-muted-foreground cursor-pointer hover:scale-105 silky-transition"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              {/* Timer progress bar */}
              {task.timerDuration && (
                <div className="flex-1 h-1.5 bg-progress-bg rounded-full overflow-hidden ml-2">
                  <div
                    className={cn(
                      'h-full rounded-full progress-fill',
                      timerComplete ? 'bg-green-500' : 'bg-primary'
                    )}
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Progress bar for subtasks */}
          {totalSubtasks > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-progress-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            </div>
          )}

          {/* Add subtask input */}
          {showAddSubtask && (
            <div className="flex items-center gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask..."
                className="h-8 text-sm bg-secondary/50"
                autoFocus
              />
              <Button size="sm" onClick={handleAddSubtask} className="h-8 silky-button cursor-pointer">
                Add
              </Button>
            </div>
          )}

          {/* Subtasks */}
          {expanded && totalSubtasks > 0 && (
            <div className="mt-3 space-y-2 pl-1">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center silky-transition flex-shrink-0 cursor-pointer hover:scale-110',
                      subtask.completed
                        ? 'bg-accent border-accent'
                        : 'border-border hover:border-accent hover:bg-accent/10'
                    )}
                  >
                    {subtask.completed && (
                      <Check className="w-2.5 h-2.5 text-accent-foreground" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'text-sm flex-1',
                      subtask.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => {
                      if (isSoundEnabled()) playSound('click')
                      onDeleteSubtask(subtask.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive silky-transition cursor-pointer hover:scale-110"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
