'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  className?: string
}

export function StreakDisplay({ currentStreak, longestStreak, className }: StreakDisplayProps) {
  const isOnFire = currentStreak >= 3
  const isSuperStreak = currentStreak >= 7

  return (
    <div className={cn('glass rounded-xl p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              'relative p-2 rounded-full',
              isOnFire 
                ? 'bg-orange-500/20 text-orange-500' 
                : 'bg-muted text-muted-foreground',
              isSuperStreak && 'animate-streak-glow'
            )}
          >
            <Flame 
              className={cn(
                'w-5 h-5',
                isOnFire && 'animate-float'
              )} 
            />
            {isSuperStreak && (
              <div className="absolute inset-0 rounded-full bg-orange-500/30 animate-ping" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold">
              {currentStreak}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                day{currentStreak !== 1 ? 's' : ''}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 0 
                ? 'Start your streak today!'
                : isOnFire 
                  ? 'You&apos;re on fire!'
                  : 'Keep it going!'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best streak</p>
          <p className="text-lg font-semibold text-primary">
            {longestStreak} day{longestStreak !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      {/* Streak milestones */}
      {currentStreak > 0 && (
        <div className="mt-4 flex gap-1">
          {[1, 3, 7, 14, 30].map((milestone) => (
            <div
              key={milestone}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors duration-500',
                currentStreak >= milestone
                  ? 'bg-gradient-to-r from-primary to-accent'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
