'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  velocityX: number
  velocityY: number
}

interface ConfettiProps {
  active: boolean
  duration?: number
  particleCount?: number
  origin?: { x: number; y: number }
}

const COLORS = [
  'oklch(0.7 0.15 280)', // purple
  'oklch(0.8 0.12 300)', // pink
  'oklch(0.75 0.1 260)', // blue
  'oklch(0.85 0.08 320)', // light pink
  'oklch(0.9 0.05 280)', // very light purple
]

export function Confetti({ 
  active, 
  duration = 1500, 
  particleCount = 30,
  origin = { x: 0.5, y: 0.5 }
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) return

    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      x: origin.x * 100,
      y: origin.y * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      velocityX: (Math.random() - 0.5) * 20,
      velocityY: -10 - Math.random() * 10,
    }))

    setParticles(newParticles)

    const timeout = setTimeout(() => {
      setParticles([])
    }, duration)

    return () => clearTimeout(timeout)
  }, [active, duration, particleCount, origin])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animation: `confetti-fall ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            '--vx': `${particle.velocityX}vw`,
            '--vy': `${particle.velocityY}vh`,
          } as React.CSSProperties}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              width="12"
              height="12"
              rx="2"
              fill={particle.color}
            />
          </svg>
        </div>
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), calc(var(--vy) + 100vh)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Mini confetti for small celebrations
export function MiniConfetti({ 
  active,
  x,
  y 
}: { 
  active: boolean
  x: number
  y: number 
}) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) return

    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.3 + Math.random() * 0.3,
      velocityX: (Math.random() - 0.5) * 100,
      velocityY: -50 - Math.random() * 50,
    }))

    setParticles(newParticles)

    const timeout = setTimeout(() => {
      setParticles([])
    }, 600)

    return () => clearTimeout(timeout)
  }, [active, x, y])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            animation: 'mini-confetti 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            '--vx': `${particle.velocityX}px`,
            '--vy': `${particle.velocityY}px`,
          } as React.CSSProperties}
        />
      ))}
      <style jsx>{`
        @keyframes mini-confetti {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), calc(var(--vy) + 80px)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
