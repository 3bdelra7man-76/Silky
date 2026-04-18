// Silky sound system - soft, calming sounds
// Using Web Audio API for procedurally generated sounds

type SoundType = 'click' | 'complete' | 'success' | 'pop' | 'toggle'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

export function playSound(type: SoundType, volume: number = 0.3) {
  if (typeof window === 'undefined') return
  
  try {
    const ctx = getAudioContext()
    
    // Create oscillator and gain nodes
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    const now = ctx.currentTime
    
    switch (type) {
      case 'click':
        // Soft click - short, gentle
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(800, now)
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05)
        gainNode.gain.setValueAtTime(volume * 0.5, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        oscillator.start(now)
        oscillator.stop(now + 0.08)
        break
        
      case 'toggle':
        // Toggle sound - gentle switch
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(500, now)
        oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.06)
        gainNode.gain.setValueAtTime(volume * 0.4, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
        oscillator.start(now)
        oscillator.stop(now + 0.1)
        break
        
      case 'pop':
        // Pop sound - bubbly
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(400, now)
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.02)
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1)
        gainNode.gain.setValueAtTime(volume * 0.6, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        oscillator.start(now)
        oscillator.stop(now + 0.15)
        break
        
      case 'complete':
        // Task complete - satisfying two-tone
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(523.25, now) // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1) // E5
        gainNode.gain.setValueAtTime(volume * 0.5, now)
        gainNode.gain.setValueAtTime(volume * 0.5, now + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        oscillator.start(now)
        oscillator.stop(now + 0.25)
        break
        
      case 'success':
        // Success - triumphant chord progression
        playChord([523.25, 659.25, 783.99], volume * 0.4, 0.3) // C major
        break
    }
  } catch {
    // Silently fail if audio isn't supported
  }
}

function playChord(frequencies: number[], volume: number, duration: number) {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * 0.05)
    
    gain.gain.setValueAtTime(0, now + i * 0.05)
    gain.gain.linearRampToValueAtTime(volume, now + i * 0.05 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration + i * 0.05)
    
    osc.start(now + i * 0.05)
    osc.stop(now + duration + i * 0.05 + 0.1)
  })
}

// Sound preference management
const SOUND_ENABLED_KEY = 'silky_sound_enabled'

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(SOUND_ENABLED_KEY)
  return stored !== 'false'
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
}
