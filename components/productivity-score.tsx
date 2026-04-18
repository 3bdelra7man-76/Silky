'use client'

import { useMemo } from 'react'

interface ProductivityScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ProductivityScore({ score, size = 'md', showLabel = true }: ProductivityScoreProps) {
  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm': return { size: 60, stroke: 4, fontSize: 'text-sm' }
      case 'lg': return { size: 140, stroke: 8, fontSize: 'text-3xl' }
      default: return { size: 100, stroke: 6, fontSize: 'text-xl' }
    }
  }, [size])

  const radius = (dimensions.size - dimensions.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-primary'
    if (score >= 40) return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  const getStrokeColor = (score: number) => {
    if (score >= 80) return 'stroke-green-500'
    if (score >= 60) return 'stroke-primary'
    if (score >= 40) return 'stroke-yellow-500'
    return 'stroke-muted-foreground'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dimensions.size, height: dimensions.size }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={dimensions.size}
          height={dimensions.size}
        >
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-progress-bg opacity-30"
          />
          {/* Progress circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            fill="none"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${getStrokeColor(score)} silky-transition`}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-semibold ${dimensions.fontSize} ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">
          Productivity
        </span>
      )}
    </div>
  )
}
