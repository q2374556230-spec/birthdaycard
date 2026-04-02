/**
 * card.ts – Card scene: wax seal drawing, crack animation, card open
 */
import gsap from 'gsap'

// ── Seal canvas drawing ──────────────────────────────────────────────────────

export function drawSeal(canvas: HTMLCanvasElement): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const size = 90
  canvas.width  = size * dpr
  canvas.height = size * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 4

  // Base circle – deep wax red with gold shimmer
  const grad = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, r)
  grad.addColorStop(0,   '#8b1a1a')
  grad.addColorStop(0.5, '#6b1010')
  grad.addColorStop(1,   '#3d0808')
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // Outer ring
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(201,168,76,0.7)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Inner ring
  ctx.beginPath()
  ctx.arc(cx, cy, r - 7, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(201,168,76,0.35)'
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Central monogram
  ctx.font = '600 22px Cinzel, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(201,168,76,0.9)'
  ctx.shadowColor = 'rgba(201,168,76,0.6)'
  ctx.shadowBlur = 8
  ctx.fillText('F', cx, cy + 1)
  ctx.shadowBlur = 0

  // Decorative dots around inner ring
  const dotCount = 12
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2
    const dx = cx + Math.cos(angle) * (r - 12)
    const dy = cy + Math.sin(angle) * (r - 12)
    ctx.beginPath()
    ctx.arc(dx, dy, 1, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(201,168,76,0.4)'
    ctx.fill()
  }
}

// ── Wax seal crack animation (CSS + GSAP) ────────────────────────────────────

export function animateSealCrack(): Promise<void> {
  return new Promise(resolve => {
    const seal = document.getElementById('wax-seal')!
    const hint = seal.querySelector('.seal-hint') as HTMLElement

    const tl = gsap.timeline({ onComplete: resolve })

    tl
      .to(hint, { opacity: 0, duration: 0.2 })
      .to(seal, {
        scale: 1.12,
        duration: 0.15,
        ease: 'power2.out',
      })
      // Crack effect: rapid shake
      .to(seal, {
        keyframes: [
          { rotation: -4, x: -3, duration: 0.06 },
          { rotation:  5, x:  4, duration: 0.06 },
          { rotation: -3, x: -2, duration: 0.05 },
          { rotation:  0, x:  0, duration: 0.05 },
        ],
        ease: 'none',
      })
      // Seal flies up and fades
      .to(seal, {
        y: -120,
        opacity: 0,
        scale: 1.3,
        duration: 0.6,
        ease: 'power3.out',
      })
  })
}

// ── Card open animation ───────────────────────────────────────────────────────

export function animateCardOpen(): Promise<void> {
  return new Promise(resolve => {
    const card      = document.getElementById('card')!
    const cardFront = document.getElementById('card-front')!
    const cardLeft  = document.getElementById('card-left')!
    const cardRight = document.getElementById('card-right')!

    // Stop float animation
    card.style.animation = 'none'

    const tl = gsap.timeline({ onComplete: resolve })

    // Reveal wings
    tl.set([cardLeft, cardRight], { opacity: 1 })

    // Front card lifts slightly
    tl.to(card, {
      y: -8,
      duration: 0.4,
      ease: 'power2.out',
    }, 0)

    // Left wing swings open
    tl.to(cardLeft, {
      rotationY: -165,
      duration: 1.4,
      ease: 'power3.inOut',
    }, 0.1)

    // Right wing swings open
    tl.to(cardRight, {
      rotationY: 165,
      duration: 1.4,
      ease: 'power3.inOut',
    }, 0.1)

    // Front face fades out (card "opens" from center)
    tl.to(cardFront, {
      opacity: 0,
      scaleX: 0.85,
      duration: 0.8,
      ease: 'power2.in',
    }, 0.3)

    // After wings are open, fade entire card
    tl.to(card, {
      opacity: 0,
      y: -30,
      duration: 0.8,
      ease: 'power2.inOut',
    }, 1.1)
  })
}

// ── Stars background ─────────────────────────────────────────────────────────

export function createStars(): void {
  const canvas = document.createElement('canvas')
  canvas.id = 'stars'
  document.getElementById('stage')!.prepend(canvas)

  const resize = () => {
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Subtle star field
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const r = Math.random() * 1.2
      const a = 0.1 + Math.random() * 0.25
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(201,168,76,${a})`
      ctx.fill()
    }
  }

  resize()
  window.addEventListener('resize', resize)
}
