import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/** Custom cursor: a precise dot + a slow golden halo that trails behind. */
export default function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    document.body.classList.add('cursor-custom')

    const dot = dotRef.current!
    const halo = haloRef.current!
    const label = labelRef.current!

    gsap.set([dot, halo], { xPercent: -50, yPercent: -50, x: -100, y: -100 })

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
    const haloX = gsap.quickTo(halo, 'x', { duration: 0.55, ease: 'power3' })
    const haloY = gsap.quickTo(halo, 'y', { duration: 0.55, ease: 'power3' })

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX)
      dotY(e.clientY)
      haloX(e.clientX)
      haloY(e.clientY)
    }

    const onOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest('[data-cursor]')
      if (t) {
        const mode = t.getAttribute('data-cursor')
        label.textContent = mode === 'view' ? 'View' : mode === 'drag' ? 'Drag' : ''
        gsap.to(halo, { scale: mode === 'view' ? 2.6 : 1.8, opacity: 1, duration: 0.4, ease: 'power3.out' })
        gsap.to(label, { opacity: mode === 'view' ? 1 : 0, duration: 0.3 })
        gsap.to(dot, { scale: 0.4, duration: 0.3 })
      } else {
        gsap.to(halo, { scale: 1, opacity: 0.6, duration: 0.5, ease: 'power3.out' })
        gsap.to(label, { opacity: 0, duration: 0.2 })
        gsap.to(dot, { scale: 1, duration: 0.3 })
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    return () => {
      document.body.classList.remove('cursor-custom')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return (
    <>
      <div
        ref={haloRef}
        className="pointer-events-none fixed left-0 top-0 z-[90] flex h-20 w-20 items-center justify-center rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, hsl(40 58% 62% / 0.14) 0%, hsl(40 58% 62% / 0.05) 45%, transparent 70%)',
          border: '1px solid hsl(40 58% 62% / 0.25)',
        }}
      >
        <span
          ref={labelRef}
          className="font-display text-[11px] italic tracking-widest opacity-0"
          style={{ color: 'hsl(40 58% 72%)' }}
        />
      </div>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[91] h-1.5 w-1.5 rounded-full"
        style={{ background: 'hsl(40 58% 68%)' }}
      />
    </>
  )
}
