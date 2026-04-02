/**
 * parchment.ts – Canvas mask reveal (fluorescent light-spot erasure)
 * The canvas starts fully painted in parchment color.
 * Mouse / touch movement "erases" (destination-out) revealing text beneath.
 * When 80% area is revealed, fires the onComplete callback.
 */

interface RevealState {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  totalPixels: number
  revealedPixels: number
  onProgress: (pct: number) => void
  onComplete: () => void
  completed: boolean
}

let state: RevealState | null = null

// Cursor glow element
let glowEl: HTMLDivElement | null = null

// ── Public API ────────────────────────────────────────────────────────────────

export function initParchmentReveal(
  onProgress: (pct: number) => void,
  onComplete: () => void
): void {
  const canvas  = document.getElementById('reveal-canvas') as HTMLCanvasElement
  const parchment = document.getElementById('parchment') as HTMLElement
  const ctx     = canvas.getContext('2d')!

  // Size the canvas to the parchment's rendered size
  const rect = parchment.getBoundingClientRect()
  canvas.width  = rect.width
  canvas.height = rect.height

  // Fill with parchment color (opaque mask)
  ctx.fillStyle = '#f5edd6'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Subtle noise texture on the mask
  addParchmentNoise(ctx, canvas.width, canvas.height)

  state = {
    canvas,
    ctx,
    totalPixels: canvas.width * canvas.height,
    revealedPixels: 0,
    onProgress,
    onComplete,
    completed: false,
  }

  // Create cursor glow
  glowEl = document.createElement('div')
  glowEl.id = 'cursor-glow'
  document.body.appendChild(glowEl)

  // Attach events
  canvas.addEventListener('mousemove', onMouseMove, { passive: true })
  canvas.addEventListener('touchmove', onTouchMove,  { passive: true })
  canvas.addEventListener('mouseenter', () => { if (glowEl) glowEl.style.opacity = '1' })
  canvas.addEventListener('mouseleave', () => { if (glowEl) glowEl.style.opacity = '0' })
}

export function destroyParchmentReveal(): void {
  if (!state) return
  state.canvas.removeEventListener('mousemove', onMouseMove)
  state.canvas.removeEventListener('touchmove', onTouchMove)
  glowEl?.remove()
  glowEl = null
  state = null
}

// ── Event handlers ────────────────────────────────────────────────────────────

function onMouseMove(e: MouseEvent): void {
  if (!state || state.completed) return
  const rect = state.canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  erase(x, y, 36)
  moveGlow(e.clientX, e.clientY)
}

function onTouchMove(e: TouchEvent): void {
  if (!state || state.completed) return
  const touch = e.touches[0]
  const rect  = state.canvas.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  erase(x, y, 44)
  moveGlow(touch.clientX, touch.clientY)
  if (glowEl) glowEl.style.opacity = '1'
}

// ── Core erase logic ──────────────────────────────────────────────────────────

function erase(cx: number, cy: number, radius: number): void {
  if (!state || state.completed) return
  const { ctx, canvas } = state

  // Eraser: destination-out radial gradient for soft edge
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  grad.addColorStop(0,   'rgba(0,0,0,1)')
  grad.addColorStop(0.6, 'rgba(0,0,0,0.8)')
  grad.addColorStop(1,   'rgba(0,0,0,0)')

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Sample revealed fraction every ~20 calls (performance)
  measureReveal()
}

let measureCounter = 0
function measureReveal(): void {
  if (!state) return
  measureCounter++
  if (measureCounter % 20 !== 0) return

  const { ctx, canvas } = state
  // Sample a grid of 32×32 points
  const sampleW = 32
  const sampleH = 32
  const stepX = canvas.width  / sampleW
  const stepY = canvas.height / sampleH
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imgData.data

  let transparent = 0
  const total = sampleW * sampleH

  for (let row = 0; row < sampleH; row++) {
    for (let col = 0; col < sampleW; col++) {
      const px = Math.floor(col * stepX)
      const py = Math.floor(row * stepY)
      const idx = (py * canvas.width + px) * 4
      if (data[idx + 3] < 30) transparent++
    }
  }

  const pct = transparent / total
  state.onProgress(pct)

  if (pct >= 0.8 && !state.completed) {
    state.completed = true
    // Erase remaining mask smoothly
    eraseFadeOut()
    state.onComplete()
  }
}

function eraseFadeOut(): void {
  if (!state) return
  const { ctx, canvas } = state

  // Animate opacity of canvas to 0 for smooth final reveal
  let alpha = 1
  const step = () => {
    if (!state) return
    alpha -= 0.03
    if (alpha <= 0) {
      state.canvas.style.opacity = '0'
      return
    }
    state.canvas.style.opacity = String(alpha)
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ── Glow cursor ───────────────────────────────────────────────────────────────

function moveGlow(x: number, y: number): void {
  if (!glowEl) return
  glowEl.style.left = x + 'px'
  glowEl.style.top  = y + 'px'
}

// ── Texture ───────────────────────────────────────────────────────────────────

function addParchmentNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  // Very subtle fibrous lines to simulate parchment texture
  ctx.save()
  ctx.globalAlpha = 0.04

  for (let i = 0; i < 30; i++) {
    const y = Math.random() * h
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(
      w * 0.25, y + (Math.random() - 0.5) * 8,
      w * 0.75, y + (Math.random() - 0.5) * 8,
      w, y + (Math.random() - 0.5) * 4
    )
    ctx.strokeStyle = '#8a6030'
    ctx.lineWidth = 0.8
    ctx.stroke()
  }

  ctx.restore()
}
