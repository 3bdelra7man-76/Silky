'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { playSound, isSoundEnabled, setSoundEnabled } from '@/lib/sounds'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('silky_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
    
    setSoundOn(isSoundEnabled())
  }, [])

  const toggleTheme = () => {
    playSound('toggle')
    setIsDark(prev => {
      const newValue = !prev
      if (newValue) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('silky_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('silky_theme', 'light')
      }
      return newValue
    })
  }

  const toggleSound = () => {
    setSoundOn(prev => {
      const newValue = !prev
      setSoundEnabled(newValue)
      if (newValue) {
        playSound('pop')
      }
      return newValue
    })
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-9 h-9" />
        <div className="w-9 h-9" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSound}
        className={cn(
          'h-9 w-9 p-0 silky-button',
          !soundOn && 'text-muted-foreground'
        )}
        title={soundOn ? 'Mute sounds' : 'Enable sounds'}
      >
        {soundOn ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="h-9 w-9 p-0 silky-button"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform" />
        ) : (
          <Moon className="h-4 w-4 rotate-0 scale-100 transition-transform" />
        )}
      </Button>
    </div>
  )
}
