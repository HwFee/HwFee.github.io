import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Category } from '@/types/work'

gsap.registerPlugin(ScrollTrigger)

/** Typographic index of collections — a preview image floats after the cursor. */
export default function CollectionsTeaser({ categories }: { categories: Category[] }) {
  const root = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<Category | null>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-cat-row]').forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            delay: i * 0.06,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 92%' },
          },
        )
      })
      const px = gsap.quickTo(previewRef.current, 'x', { duration: 0.6, ease: 'power3' })
      const py = gsap.quickTo(previewRef.current, 'y', { duration: 0.6, ease: 'power3' })
      const onMove = (e: MouseEvent) => {
        px(e.clientX + 28)
        py(e.clientY - 120)
      }
      window.addEventListener('mousemove', onMove, { passive: true })
      return () => window.removeEventListener('mousemove', onMove)
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="relative mx-auto max-w-[1600px] px-6 md:px-12">
      <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold)/0.9)]">Collections</p>
      <h2 className="font-display mb-16 text-[clamp(2rem,5vw,4.5rem)] font-light italic leading-none text-[hsl(var(--cream))]">
        Rooms of the house
      </h2>

      <div className="border-t border-[hsl(var(--cream)/0.08)]">
        {categories.map((cat, i) => (
          <Link
            key={cat.name}
            to={`/collections/${encodeURIComponent(cat.name)}`}
            data-cat-row
            data-cursor="link"
            onMouseEnter={() => {
              setActive(cat)
              gsap.to(previewRef.current, { opacity: 1, scale: 1, rotate: i % 2 ? 2 : -2, duration: 0.5, ease: 'expo.out' })
            }}
            onMouseLeave={() => gsap.to(previewRef.current, { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.in' })}
            className="group flex items-center justify-between border-b border-[hsl(var(--cream)/0.08)] py-7 transition-colors duration-500 hover:bg-[hsl(var(--cream)/0.02)] md:py-9"
          >
            <div className="flex items-baseline gap-5 md:gap-10">
              <span className="font-display text-sm italic text-[hsl(var(--gold)/0.7)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-[clamp(1.8rem,4.5vw,4rem)] font-light leading-none text-[hsl(var(--cream)/0.85)] transition-all duration-500 group-hover:translate-x-3 group-hover:italic group-hover:text-[hsl(var(--cream))]">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.4)]">
                {cat.works.length} {cat.works.length === 1 ? 'work' : 'works'}
              </span>
              <span className="font-display text-2xl italic text-[hsl(var(--cream)/0.3)] transition-all duration-500 group-hover:translate-x-2 group-hover:text-[hsl(var(--gold))]">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* floating preview that trails the pointer */}
      <div
        ref={previewRef}
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden h-56 w-44 overflow-hidden rounded-[2px] opacity-0 shadow-[0_40px_80px_-20px_hsl(224_34%_2%/0.9)] md:block"
        style={{ transform: 'scale(0.9)' }}
      >
        {active && <img src={active.cover.image} alt="" className="h-full w-full object-cover" />}
      </div>
    </div>
  )
}
