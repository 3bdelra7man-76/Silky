'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DayRecord } from '@/lib/types'
import { formatDate } from '@/lib/store'
import { ProductivityScore } from './productivity-score'

interface DayDetailProps {
  record: DayRecord
  onClose: () => void
}

export function DayDetail({ record, onClose }: DayDetailProps) {
  const completedTasks = record.tasks.filter(t => t.completed).length

  return (
    <div className="glass rounded-2xl p-6 animate-in slide-in-from-right-5 duration-300 max-h-[60vh] md:max-h-none overflow-y-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">{formatDate(record.date)}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {completedTasks} of {record.tasks.length} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ProductivityScore score={record.productivityScore} size="sm" showLabel={false} />
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 cursor-pointer hover:scale-110 silky-transition">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tasks */}
      {record.tasks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tasks</h4>
          <div className="space-y-2">
            {record.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    task.completed
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}
                >
                  {task.completed && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                    </svg>
                  )}
                </div>
                <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                  {task.title}
                </span>
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {record.activities.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Activities</h4>
          <div className="space-y-2">
            {record.activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
              >
                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full capitalize">
                  {activity.type}
                </span>
                <span className="flex-1">{activity.title}</span>
                {activity.duration && (
                  <span className="text-xs text-muted-foreground">{activity.duration}m</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {record.tasks.length === 0 && record.activities.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No tasks or activities recorded for this day
        </p>
      )}
    </div>
  )
}
