/**
 * final.ts – Final chapter: floating text + gentle gold mote canvas
 */
import gsap from 'gsap'

interface Mote {
  x: number
  y: number
  vy: number
  vx: number
  r: number
  opacity: number
  maxOpacity: number
  phase: number
  speed: number
}

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let motes: Mote[] = []
let rafId: number | null = null

// ── Public API ────────────────────────────────────────────────────────────────

export function initFinalScene(): void {
  canvas = document.getElementById('final-canvas') as HTMLCanvasElement
  ctx = canvas.getContext('2d')!
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Spawn motes
  spawnMotes()
  startLoop()
}

export function animateFinalEntrance(): void {
  const scene = document.getElementById('scene-final')!
  const finalText = document.getElementById('final-text')!

  gsap.set(scene, { opacity: 0, pointerEvents: 'auto' })
  gsap.set(finalText, { y: 30, opacity: 0 })

  const tl = gsap.timeline()

  // Scene fades in
  tl.to(scene, {
    opacity: 1,
    duration: 1.2,
    ease: 'power2.inOut',
  })

  // Main text rises and appears
  tl.to(finalText, {
    y: 0,
    opacity: 1,
    duration: 1.4,
    ease: 'power3.out',
  }, '-=0.5')

  // Add floating class after entrance
  tl.call(() => {
    finalText.classList.add('animate-float')
  })
}

// ── Mote system ───────────────────────────────────────────────────────────────

function spawnMotes(): void {
  const count = 28
  for (let i = 0; i < count; i++) {
    motes.push(createMote(true))
  }
}

function createMote(randomY = false): Mote {
  return {
    x:          Math.random() * window.innerWidth,
    y:          randomY
                  ? Math.random() * window.innerHeight
                  : window.innerHeight + 10,
    vx:         (Math.random() - 0.5) * 0.3,
    vy:         -(0.15 + Math.random() * 0.4),
    r:          1 + Math.random() * 2.5,
    opacity:    0,
    maxOpacity: 0.3 + Math.random() * 0.45,
    phase:      Math.random() * Math.PI * 2,
    speed:      0.008 + Math.random() * 0.012,
  }
}

function startLoop(): void {
  const loop = () => {
    rafId = requestAnimationFrame(loop)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    updateMotes()
  }
  loop()
}

function updateMotes(): void {
  // Respawn if off screen
  for (let i = 0; i < motes.length; i++) {
    const m = motes[i]
    m.x  += m.vx
    m.y  += m.vy
    m.phase += m.speed
    m.opacity = Math.max(0, Math.min(m.maxOpacity, m.opacity + 0.005))

    if (m.y < -10) {
      motes[i] = createMote(false)
    }

    const pulse = 0.6 + 0.4 * Math.sin(m.phase)
    ctx.save()
    ctx.globalAlpha = m.opacity * pulse

    const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 2)
    grad.addColorStop(0, '#f5e070')
    grad.addColorStop(0.5, '#c9a84c')
    grad.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.arc(m.x, m.y, m.r * 2, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
  }
}

function resizeCanvas(): void {
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
}
