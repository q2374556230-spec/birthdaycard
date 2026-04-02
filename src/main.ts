/**
 * main.ts – Master orchestrator
 * Wires all modules together via GSAP timeline and event flow.
 */
import './style.css'
import gsap from 'gsap'

import { drawSeal, animateSealCrack, animateCardOpen, createStars } from './card'
import { initParticleCanvas, burstParticles, showParticleCanvas } from './particles'
import { initParchmentReveal, destroyParchmentReveal } from './parchment'
import { initFinalScene, animateFinalEntrance } from './final'
import { initAudio, playTransitionTone, startAmbient } from './audio'

// ── State ─────────────────────────────────────────────────────────────────────
type Phase = 'card' | 'opening' | 'parchment' | 'final'
let phase: Phase = 'card'

// ── Boot ──────────────────────────────────────────────────────────────────────

function boot(): void {
  // Background stars
  createStars()

  // Draw wax seal on canvas
  const sealCanvas = document.getElementById('seal-canvas') as HTMLCanvasElement
  drawSeal(sealCanvas)

  // Particle canvas ready
  initParticleCanvas()

  // Audio (default muted, button to enable)
  initAudio()

  // Scene 1: fade in card
  gsap.to('#scene-card', {
    opacity: 1,
    duration: 1.6,
    ease: 'power2.out',
    delay: 0.4,
    onComplete: () => {
      (document.getElementById('scene-card') as HTMLElement).style.pointerEvents = 'auto'
    },
  })

  // Wax seal click handler
  document.getElementById('wax-seal')!.addEventListener('click', handleSealClick, { once: true })
}

// ── Phase transitions ─────────────────────────────────────────────────────────

async function handleSealClick(): Promise<void> {
  if (phase !== 'card') return
  phase = 'opening'

  playTransitionTone(440, 0.8)

  // 1. Crack and lift seal
  await animateSealCrack()

  // 2. Burst particles from seal center (screen coordinates)
  const sealEl = document.getElementById('wax-seal')!
  const sealRect = sealEl.getBoundingClientRect()
  const cx = sealRect.left + sealRect.width / 2
  const cy = sealRect.top + sealRect.height / 2

  showParticleCanvas()
  burstParticles(cx, cy)

  // 3. Open card wings
  await animateCardOpen()

  // 4. Transition: fade out card scene, pause, then show parchment
  playTransitionTone(528, 1.2)
  await transitionToScene('scene-card', 'scene-parchment', 0.3)

  phase = 'parchment'
  startParchmentPhase()
}

function startParchmentPhase(): void {
  // Init reveal canvas after scene is visible (so layout is settled)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      initParchmentReveal(
        (_pct) => {
          // Could animate hint opacity etc. – kept minimal
        },
        handleRevealComplete
      )

      // Fade out hint after first interaction
      let hintHidden = false
      const hideHint = () => {
        if (hintHidden) return
        hintHidden = true
        gsap.to('.parchment-hint', { opacity: 0, duration: 0.5 })
        document.getElementById('parchment')!.removeEventListener('mousemove', hideHint)
        document.getElementById('parchment')!.removeEventListener('touchmove', hideHint)
      }
      document.getElementById('parchment')!.addEventListener('mousemove', hideHint, { passive: true })
      document.getElementById('parchment')!.addEventListener('touchmove', hideHint, { passive: true })
    })
  })
}

function handleRevealComplete(): void {
  if (phase !== 'parchment') return
  phase = 'final'

  destroyParchmentReveal()
  playTransitionTone(660, 1.8)
  startAmbient()

  // Fade out parchment scene
  gsap.to('#scene-parchment', {
    opacity: 0,
    duration: 1.0,
    ease: 'power2.inOut',
    delay: 0.5,
    onComplete: () => {
      ;(document.getElementById('scene-parchment') as HTMLElement).style.display = 'none'

      // Show final scene
      const sceneF = document.getElementById('scene-final')!
      sceneF.style.opacity = '0'
      sceneF.style.pointerEvents = 'auto'
      sceneF.style.display = 'flex'

      initFinalScene()
      animateFinalEntrance()
    },
  })
}

// ── Helper: cross-scene fade ──────────────────────────────────────────────────

function transitionToScene(
  fromId: string,
  toId: string,
  overlap = 0.3
): Promise<void> {
  return new Promise(resolve => {
    const fromEl = document.getElementById(fromId)!
    const toEl   = document.getElementById(toId)!

    const tl = gsap.timeline({ onComplete: resolve })

    tl.to(fromEl, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        fromEl.style.pointerEvents = 'none'
      },
    })

    tl.to(toEl, {
      opacity: 1,
      duration: 1.0,
      ease: 'power2.out',
      onStart: () => {
        toEl.style.pointerEvents = 'auto'
      },
    }, `-=${overlap}`)
  })
}

// ── Start ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', boot)
