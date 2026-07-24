import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import type { Work } from '@/types/work'
import { getLenis } from '@/hooks/useLenis'

export interface ViewerState {
  list: Work[]
  index: number
  originRect: DOMRect | null
}

interface Props {
  state: ViewerState
  onClose: () => void
}

/** Immersive continuous viewer — walk the gallery piece by piece.
 *  Opens with a shared-element flight from the card, closes flying back. */
export default function Viewer({ state, onClose }: Props) {
  const { list } = state
  const [index, setIndex] = useState(state.index)
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter')
  const work = list[index]

  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const wheelLock = useRef(0)
  const closing = useRef(false)

  /* ---------- lock page scroll while open ---------- */
  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.body.style.overflow = ''
    }
  }, [])

  /* ---------- entrance: fly from the card's rect ---------- */
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const origin = state.originRect
    const final = frame.getBoundingClientRect()
    if (origin) {
      const dx = origin.left + origin.width / 2 - (final.left + final.width / 2)
      const dy = origin.top + origin.height / 2 - (final.top + final.height / 2)
      const sx = origin.width / final.width
      const sy = origin.height / final.height
      gsap.fromTo(
        frame,
        { x: dx, y: dy, scaleX: sx, scaleY: sy, opacity: 1 },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.85, ease: 'expo.inOut' },
      )
    } else {
      gsap.fromTo(frame, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' })
    }
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    const tl = gsap.timeline({ delay: 0.45, onComplete: () => setPhase('idle') })
    tl.fromTo(titleRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out' })
      .fromTo(metaRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, '-=0.65')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- navigation ---------- */
  const go = useCallback(
    (dir: 1 | -1) => {
      if (phase !== 'idle') return
      const next = (index + dir + list.length) % list.length
      if (next === index) return
      const frame = frameRef.current
      const tl = gsap.timeline({
        onComplete: () => {
          setIndex(next)
        },
      })
      // narrative exit: drift, soften, dissolve — like turning a page
      tl.to(frame, {
        x: dir * -70,
        scale: 0.965,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.42,
        ease: 'power2.in',
      })
      tl.to([titleRef.current, metaRef.current], { y: dir * -24, opacity: 0, duration: 0.32, ease: 'power2.in' }, 0)
      prevIndex.current = index
    },
    [index, list.length, phase],
  )

  /* animate incoming after index change */
  const prevIndex = useRef(state.index)
  useEffect(() => {
    if (phase !== 'idle' || prevIndex.current === index) return
    prevIndex.current = index
    const frame = frameRef.current
    if (!frame) return
    gsap.fromTo(
      frame,
      { x: 70, scale: 0.965, opacity: 0, filter: 'blur(10px)' },
      { x: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.65, ease: 'expo.out' },
    )
    gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', delay: 0.12 })
    gsap.fromTo(metaRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.2 })
  }, [index, phase])

  /* ---------- close: fly back to the card ---------- */
  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setPhase('exit')
    const card = document.querySelector(`[data-work-id="${work.id}"]`)
    const frame = frameRef.current
    const tl = gsap.timeline({ onComplete: onClose })
    tl.to([titleRef.current, metaRef.current], { y: 30, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
    if (card && frame) {
      const origin = card.getBoundingClientRect()
      const final = frame.getBoundingClientRect()
      const dx = origin.left + origin.width / 2 - (final.left + final.width / 2)
      const dy = origin.top + origin.height / 2 - (final.top + final.height / 2)
      tl.to(
        frame,
        { x: dx, y: dy, scaleX: origin.width / final.width, scaleY: origin.height / final.height, duration: 0.7, ease: 'expo.inOut' },
        0.05,
      )
    } else if (frame) {
      tl.to(frame, { scale: 0.92, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
    }
    tl.to(rootRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.35)
  }, [work.id, onClose])

  /* ---------- inputs: keyboard / wheel / touch ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = performance.now()
      if (now - wheelLock.current < 950 || Math.abs(e.deltaY) < 18) return
      wheelLock.current = now
      go(e.deltaY > 0 ? 1 : -1)
    }
    let touchY: number | null = null
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY)
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY === null) return
      const dy = touchY - e.changedTouches[0].clientY
      if (Math.abs(dy) > 60) go(dy > 0 ? 1 : -1)
      touchY = null
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [go, close])

  /* preload neighbors */
  useEffect(() => {
    ;[1, -1].forEach((d) => {
      const w = list[(index + d + list.length) % list.length]
      if (w) new Image().src = w.image
    })
  }, [index, list])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] flex flex-col select-none opacity-0"
      style={{ background: 'hsl(224 34% 6% / 0.97)' }}
      role="dialog"
      aria-modal="true"
    >
      {/* ambient tint drawn from the work */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25 blur-[120px] transition-all duration-1000"
        style={{ backgroundImage: `url(${work.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--cream)/0.45)]">Curio — Salon</span>
        <button
          onClick={close}
          data-cursor="link"
          className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.6)] transition-colors hover:text-[hsl(var(--gold))]"
        >
          Close
          <span className="inline-block h-px w-8 bg-current transition-all duration-500 group-hover:w-12" />
          <span className="font-display text-base italic">×</span>
        </button>
      </div>

      {/* stage */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-4 md:px-24">
        <div
          ref={frameRef}
          className="relative max-h-[68vh] max-w-[min(88vw,1100px)] overflow-hidden rounded-[2px] shadow-[0_60px_120px_-30px_hsl(224_34%_2%/0.95)] will-change-transform"
        >
          <img
            key={work.id}
            src={work.image}
            alt={work.title}
            className="max-h-[68vh] w-auto max-w-full object-contain"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_0_1px_hsl(var(--cream)/0.12)]" />
        </div>

        {/* floating title — typography is part of the exhibit */}
        <h2
          ref={titleRef}
          className="font-display pointer-events-none absolute bottom-[6%] left-[4%] z-20 max-w-[70vw] text-[clamp(2.2rem,6.5vw,5.5rem)] font-light italic leading-[0.95] text-[hsl(var(--cream))] opacity-0 [text-shadow:0_4px_40px_hsl(224_34%_4%/0.9)] md:left-[7%]"
        >
          {work.title}
        </h2>
      </div>

      {/* meta strip */}
      <div ref={metaRef} className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-7 opacity-0 md:px-12">
        <div className="flex flex-col gap-5 border-t border-[hsl(var(--cream)/0.1)] pt-5 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-[hsl(var(--cream)/0.62)]">{work.description}</p>
          <div className="flex items-center gap-8">
            <div className="flex gap-2">
              {work.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[hsl(var(--gold)/0.35)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--gold)/0.85)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="text-right">
              <div className="font-display text-2xl italic text-[hsl(var(--cream))]">
                {String(index + 1).padStart(2, '0')}
                <span className="mx-1 text-sm not-italic text-[hsl(var(--cream)/0.4)]">/</span>
                <span className="text-sm not-italic text-[hsl(var(--cream)/0.4)]">{String(list.length).padStart(2, '0')}</span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.4)]">
                scroll or use arrows
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* side arrows (desktop) */}
      {(['prev', 'next'] as const).map((side) => (
        <button
          key={side}
          data-cursor="link"
          aria-label={side}
          onClick={() => go(side === 'next' ? 1 : -1)}
          className={`group absolute top-1/2 z-20 hidden -translate-y-1/2 items-center gap-3 md:flex ${
            side === 'prev' ? 'left-6 md:left-10' : 'right-6 flex-row-reverse md:right-10'
          }`}
        >
          <span className="font-display text-3xl italic text-[hsl(var(--cream)/0.35)] transition-all duration-500 group-hover:text-[hsl(var(--gold))]">
            {side === 'prev' ? '←' : '→'}
          </span>
        </button>
      ))}
    </div>
  )
}
