'use client'

import { Brain, Book, Dumbbell, Repeat, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Activity } from '@/lib/types'
import { playSound, isSoundEnabled } from '@/lib/sounds'

const ACTIVITY_ICONS = {
  learning: Brain,
  reading: Book,
  exercise: Dumbbell,
  habit: Repeat,
  other: Star,
}

const ACTIVITY_COLORS = {
  learning: 'bg-purple-500/20 text-purple-600',
  reading: 'bg-blue-500/20 text-blue-600',
  exercise: 'bg-green-500/20 text-green-600',
  habit: 'bg-orange-500/20 text-orange-600',
  other: 'bg-pink-500/20 text-pink-600',
}

interface ActivityItemProps {
  activity: Activity
  onDelete: () => void
}

export function ActivityItem({ activity, onDelete }: ActivityItemProps) {
  const Icon = ACTIVITY_ICONS[activity.type]
  const colorClass = ACTIVITY_COLORS[activity.type]

  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3 group silky-transition glass-hover">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{activity.title}</h4>
        {activity.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {activity.description}
          </p>
        )}
        {activity.duration && (
          <span className="text-xs text-muted-foreground mt-1 inline-block">
            {activity.duration} min
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (isSoundEnabled()) playSound('click')
          onDelete()
        }}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive silky-transition cursor-pointer hover:scale-110"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
