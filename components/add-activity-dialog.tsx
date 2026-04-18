'use client'

import { useState } from 'react'
import { Brain, Book, Dumbbell, Repeat, Star, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ActivityType, ACTIVITY_TYPES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { playSound, isSoundEnabled } from '@/lib/sounds'

const ACTIVITY_ICONS = {
  learning: Brain,
  reading: Book,
  exercise: Dumbbell,
  habit: Repeat,
  other: Star,
}

interface AddActivityDialogProps {
  onAdd: (activity: { type: ActivityType; title: string; description?: string; duration?: number }) => void
}

export function AddActivityDialog({ onAdd }: AddActivityDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ActivityType>('learning')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd({
        type: selectedType,
        title: title.trim(),
        description: description.trim() || undefined,
        duration: duration ? parseInt(duration) : undefined,
      })
      setTitle('')
      setDescription('')
      setDuration('')
      setOpen(false)
    }
  }

  const handleTypeSelect = (type: ActivityType) => {
    if (isSoundEnabled()) playSound('toggle')
    setSelectedType(type)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isSoundEnabled()) playSound(newOpen ? 'pop' : 'click')
      setOpen(newOpen)
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2 silky-button cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-md animate-in fade-in zoom-in-95">
        <DialogHeader>
          <DialogTitle>Log an Activity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Activity type selector */}
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_TYPES.map((type) => {
              const Icon = ACTIVITY_ICONS[type.value]
              return (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg silky-transition cursor-pointer hover:scale-105',
                    selectedType === type.value
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{type.label}</span>
                </button>
              )
            })}
          </div>

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="What did you do?"
            className="bg-secondary/50"
          />

          {/* Description */}
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any details? (optional)"
            className="bg-secondary/50"
          />

          {/* Duration */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration"
              className="bg-secondary/50"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">minutes</span>
          </div>

          <Button onClick={handleSubmit} className="w-full silky-button cursor-pointer">
            Add Activity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
