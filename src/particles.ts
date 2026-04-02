/**
 * particles.ts – Lightweight butterfly + gold dust system
 * Canvas-based, no external libs beyond gsap for fade control
 */
import gsap from 'gsap'

interface ButterflyParticle {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  angleSpeed: number
  wingPhase: number
  wingSpeed: number
  size: number
  opacity: number
  life: number        // 0–1 remaining
  decay: number
  hue: number         // slight color variation
}

interface DustParticle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  opacity: number
  decay: number
  gold: boolean
}

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let butterflies: ButterflyParticle[] = []
let dust: DustParticle[] = []
let rafId: number | null = null
let running = false

// ── Public API ────────────────────────────────────────────────────────────────

export function initParticleCanvas(): void {
  canvas = document.getElementById('particle-canvas') as HTMLCanvasElement
  ctx = canvas.getContext('2d')!
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
}

export function burstParticles(
  cx: number,
  cy: number,
  onDone?: () => void
): void {
  spawnBurst(cx, cy)
  if (!running) startLoop()

  // After 3.5 s, fade canvas out
  gsap.to(canvas, {
    opacity: 0,
    delay: 2.2,
    duration: 0.9,
    ease: 'power2.inOut',
    onComplete: () => {
      stopLoop()
      butterflies = []
      dust = []
      onDone?.()
    },
  })
}

export function showParticleCanvas(): void {
  gsap.to(canvas, { opacity: 1, duration: 0.3 })
}

// ── Spawn ─────────────────────────────────────────────────────────────────────

function spawnBurst(cx: number, cy: number): void {
  // 10–14 butterflies
  const bCount = 10 + Math.floor(Math.random() * 5)
  for (let i = 0; i < bCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 0.6 + Math.random() * 1.4
    butterflies.push({
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 60,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      angle,
      angleSpeed: (Math.random() - 0.5) * 0.025,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 0.08 + Math.random() * 0.06,
      size: 8 + Math.random() * 10,
      opacity: 0.85 + Math.random() * 0.15,
      life: 1,
      decay: 0.003 + Math.random() * 0.003,
      hue: Math.random() > 0.5 ? 220 : 270, // blue or soft purple
    })
  }

  // 40 gold dust particles
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 2.5
    dust.push({
      x: cx + (Math.random() - 0.5) * 80,
      y: cy + (Math.random() - 0.5) * 80,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      r: 1.2 + Math.random() * 2.5,
      opacity: 0.8 + Math.random() * 0.2,
      decay: 0.01 + Math.random() * 0.01,
      gold: Math.random() > 0.3,
    })
  }
}

// ── Render loop ───────────────────────────────────────────────────────────────

function startLoop(): void {
  running = true
  loop()
}

function stopLoop(): void {
  running = false
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function loop(): void {
  if (!running) return
  rafId = requestAnimationFrame(loop)

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  updateDust()
  updateButterflies()

  if (butterflies.length === 0 && dust.length === 0) {
    stopLoop()
  }
}

// ── Draw helpers ──────────────────────────────────────────────────────────────

function updateDust(): void {
  dust = dust.filter(p => p.opacity > 0.01)
  for (const p of dust) {
    // Physics
    p.x  += p.vx
    p.y  += p.vy
    p.vy += 0.04   // gravity
    p.vx *= 0.985  // drag
    p.opacity -= p.decay

    ctx.save()
    ctx.globalAlpha = Math.max(0, p.opacity)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    if (p.gold) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
      g.addColorStop(0, '#f5d78a')
      g.addColorStop(1, '#c9a84c')
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = `hsl(220, 80%, 80%)`
    }
    ctx.fill()
    ctx.restore()
  }
}

function updateButterflies(): void {
  butterflies = butterflies.filter(p => p.life > 0)
  for (const b of butterflies) {
    // Movement
    b.angle += b.angleSpeed
    b.vx += Math.cos(b.angle) * 0.02
    b.vy += Math.sin(b.angle) * 0.015 - 0.012  // slight upward drift
    b.vx *= 0.97
    b.vy *= 0.97
    b.x += b.vx
    b.y += b.vy
    b.wingPhase += b.wingSpeed
    b.life -= b.decay

    drawButterfly(b)
  }
}

function drawButterfly(b: ButterflyParticle): void {
  const wingSpan = Math.abs(Math.sin(b.wingPhase))  // 0..1 flap
  const alpha = Math.max(0, b.life) * b.opacity

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(b.x, b.y)
  ctx.rotate(b.angle + Math.PI / 2)

  // Color scheme: blue-ish with gold edge
  const bodyColor = `hsl(${b.hue}, 70%, 75%)`
  const edgeColor = `hsla(45, 80%, 75%, 0.6)`

  // Wing geometry: two bezier curves per side (top, bottom)
  const s = b.size
  const flap = wingSpan

  // Left wings
  drawWing(ctx, s, flap, bodyColor, edgeColor, -1)
  // Right wings
  drawWing(ctx, s, flap, bodyColor, edgeColor, 1)

  // Body
  ctx.beginPath()
  ctx.ellipse(0, 0, 1.5, s * 0.35, 0, 0, Math.PI * 2)
  ctx.fillStyle = `hsl(${b.hue}, 50%, 35%)`
  ctx.fill()

  ctx.restore()
}

function drawWing(
  ctx: CanvasRenderingContext2D,
  s: number,
  flap: number,
  fill: string,
  edge: string,
  side: -1 | 1
): void {
  const sw = s * flap * side

  // Upper wing
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(sw * 0.4, -s * 0.3, sw, -s * 0.9, sw * 0.6, -s * 0.15)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = edge
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Lower wing (smaller)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(sw * 0.5, s * 0.2, sw * 0.9, s * 0.7, sw * 0.3, s * 0.35)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.globalAlpha *= 0.8
  ctx.fill()
  ctx.strokeStyle = edge
  ctx.lineWidth = 0.4
  ctx.stroke()
}

function resizeCanvas(): void {
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
}
