/**
 * audio.ts – Minimal audio manager with Web Audio API
 * Default: muted. Toggle button shows current state.
 */

// Inline base64 audio fallback + Web Audio synthesis
// We use the Web Audio API to generate soft ambient tones (no external files needed)

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let muted = true
let ambientNodes: AudioNode[] = []
let initialized = false

// ── Public API ────────────────────────────────────────────────────────────────

export function initAudio(): void {
  const btn       = document.getElementById('audio-btn')!
  const iconMute  = document.getElementById('icon-mute')!
  const iconSound = document.getElementById('icon-sound')!

  btn.addEventListener('click', () => {
    if (!initialized) {
      setupAudioContext()
      initialized = true
    }
    toggleMute()
    iconMute.style.display  = muted ? 'block' : 'none'
    iconSound.style.display = muted ? 'none'  : 'block'
  })
}

export function playTransitionTone(freq = 528, duration = 1.5): void {
  if (muted || !audioCtx) return
  playSoftTone(freq, duration)
}

export function startAmbient(): void {
  if (muted || !audioCtx) return
  playAmbientPad()
}

// ── Internal ──────────────────────────────────────────────────────────────────

function setupAudioContext(): void {
  audioCtx  = new AudioContext()
  masterGain = audioCtx.createGain()
  masterGain.gain.value = 0.18
  masterGain.connect(audioCtx.destination)
  muted = false
  playAmbientPad()
}

function toggleMute(): void {
  muted = !muted
  if (!audioCtx || !masterGain) return

  if (muted) {
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3)
  } else {
    masterGain.gain.setTargetAtTime(0.18, audioCtx.currentTime, 0.3)
    if (ambientNodes.length === 0) playAmbientPad()
  }
}

function playSoftTone(freq: number, duration: number): void {
  if (!audioCtx || !masterGain) return

  const osc  = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = 'sine'
  osc.frequency.value = freq

  gain.gain.setValueAtTime(0, audioCtx.currentTime)
  gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)

  osc.connect(gain)
  gain.connect(masterGain)
  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + duration)
}

function playAmbientPad(): void {
  if (!audioCtx || !masterGain) return

  // Layer 3 detuned sine waves for a soft "crystalline" pad
  const baseFreqs = [220, 277.18, 329.63]  // A3, C#4, E4 – A major triad
  ambientNodes = []

  for (const freq of baseFreqs) {
    const osc    = audioCtx.createOscillator()
    const detune = (Math.random() - 0.5) * 6
    const gain   = audioCtx.createGain()
    const filter = audioCtx.createBiquadFilter()

    osc.type = 'sine'
    osc.frequency.value = freq
    osc.detune.value = detune

    filter.type = 'lowpass'
    filter.frequency.value = 800

    gain.gain.value = 0.25

    // Gentle tremolo via LFO
    const lfo     = audioCtx.createOscillator()
    const lfoGain = audioCtx.createGain()
    lfo.frequency.value = 0.3 + Math.random() * 0.2
    lfoGain.gain.value  = 0.04
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(masterGain)
    osc.start()

    ambientNodes.push(osc, lfo)
  }
}
