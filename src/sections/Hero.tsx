import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import DustField from '@/components/gallery/DustField'
import type { Work } from '@/types/work'

export default function Hero({ featured, onOpen }: { featured: Work; onOpen: (el: HTMLElement) => void }) {
  const root = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo('[data-hero-frame]', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4 })
        .fromTo('[data-hero-img]', { scale: 1.35 }, { scale: 1, duration: 1.8 }, 0)
        .fromTo('[data-hero-line]', { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.35)
        .fromTo('[data-hero-side]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15 }, 0.9)
        .fromTo('[data-hero-meta]', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1)

      // pointer parallax — the room breathes with you
      const onMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2
        const y = (e.clientY / window.innerHeight - 0.5) * 2
        gsap.to(frameRef.current, { rotateY: x * 4, rotateX: -y * 3, x: x * 14, y: y * 10, duration: 1.2, ease: 'power3.out' })
        gsap.to('[data-hero-word]', { x: x * -30, duration: 1.4, ease: 'power3.out' })
      }
      window.addEventListener('mousemove', onMove, { passive: true })

      // scroll drift
      gsap.to('[data-hero-frame]', {
        yPercent: -12,
        scale: 0.94,
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('[data-hero-word]', {
        yPercent: 30,
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })

      return () => window.removeEventListener('mousemove', onMove)
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="vignette relative flex h-[100svh] items-center justify-center overflow-hidden">
      <DustField />

      {/* colossal word behind the frame */}
      <h1
        data-hero-word
        className="font-display text-outline pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 select-none justify-between px-[2vw] text-[clamp(5rem,20vw,20rem)] font-light uppercase leading-none"
      >
        {'Curio'.split('').map((ch) => (
          <span key={ch}>{ch}</span>
        ))}
      </h1>

      {/* featured frame */}
      <div className="relative z-10" style={{ perspective: '1400px' }}>
        <div ref={frameRef} className="will-change-transform">
          <div
            data-hero-frame
            data-cursor="view"
            onClick={(e) => onOpen(e.currentTarget)}
            className="relative h-[46vh] w-[76vw] select-none overflow-hidden rounded-[2px] shadow-[0_80px_140px_-40px_hsl(224_34%_2%/1)] sm:h-[54vh] sm:w-[52vw] md:w-[44vw] lg:w-[36vw]"
          >
            <img
              data-hero-img
              src={featured.image}
              alt={featured.title}
              className="h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 [box-shadow:inset_0_0_0_1px_hsl(var(--cream)/0.14)]" />
          </div>
          {/* caption rides the frame's top-left edge — diagonal counterweight to the title at bottom-right */}
          <div data-hero-side className="absolute -left-14 -top-2 hidden md:block">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--cream)/0.65)] [text-shadow:0_1px_14px_hsl(224_34%_4%/0.9)]">
              N°01 — {featured.tags.join(' · ')}
            </span>
          </div>
          {/* narrow screens: same caption hangs vertically along the frame's left edge */}
          <div data-hero-side className="absolute -left-3 top-4 -rotate-90 md:hidden" style={{ transformOrigin: 'left top' }}>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--cream)/0.65)]">
              N°01 — {featured.tags.join(' · ')}
            </span>
          </div>
          <div data-hero-side className="absolute -right-2 -bottom-10 text-right md:-right-16">
            <p className="font-display text-xl italic text-[hsl(var(--gold))] md:text-2xl">{featured.title}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.45)]">current exhibit</p>
          </div>
        </div>
      </div>

      {/* stacked headline lines */}
      <div className="pointer-events-none absolute bottom-[12%] left-6 z-10 md:left-12">
        {['Look', 'slowly.'].map((line) => (
          <div key={line} className="overflow-hidden">
            <span
              data-hero-line
              className="font-display block text-[clamp(2.4rem,7vw,6rem)] font-light italic leading-[1.02] text-[hsl(var(--cream))]"
            >
              {line}
            </span>
          </div>
        ))}
      </div>

      <div data-hero-meta className="absolute bottom-8 right-6 z-10 flex items-center gap-3 md:right-12">
        <span className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--cream)/0.5)]">Scroll to enter the salon</span>
        <span className="block h-10 w-px bg-gradient-to-b from-[hsl(var(--gold))] to-transparent" />
      </div>
    </section>
  )
}
