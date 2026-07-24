import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import WorkCard from '@/components/gallery/WorkCard'
import type { Work } from '@/types/work'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  works: Work[]
  onOpen: (work: Work, el: HTMLElement) => void
}

/* Editorial offsets — an irregular hanging, never a grid. */
const placements: { wrap: string; aspect: string }[] = [
  { wrap: 'md:col-span-5 md:mt-0', aspect: 'aspect-[4/5]' },
  { wrap: 'md:col-span-4 md:col-start-7 md:mt-40', aspect: 'aspect-[3/4]' },
  { wrap: 'md:col-span-3 md:col-start-11 md:mt-16', aspect: 'aspect-[2/3]' },
  { wrap: 'md:col-span-4 md:col-start-2 md:-mt-10', aspect: 'aspect-[4/3]' },
  { wrap: 'md:col-span-5 md:col-start-7 md:mt-24', aspect: 'aspect-[3/4]' },
  { wrap: 'md:col-span-3 md:col-start-3 md:mt-32', aspect: 'aspect-[3/4]' },
  { wrap: 'md:col-span-4 md:col-start-8 md:-mt-8', aspect: 'aspect-[4/5]' },
  { wrap: 'md:col-span-5 md:col-start-2 md:mt-20', aspect: 'aspect-[16/10]' },
  { wrap: 'md:col-span-4 md:col-start-8 md:mt-12', aspect: 'aspect-[2/3]' },
]

/* words that hang between the frames */
const interludes: Record<number, string> = { 2: 'light', 5: 'silence' }

export default function SalonWall({ works, onOpen }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-wall-item]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 90, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.3,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>('[data-wall-speed]').forEach((el) => {
        const speed = parseFloat(el.dataset.wallSpeed || '0')
        gsap.to(el, {
          y: -speed * 120,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        })
      })
      gsap.utils.toArray<HTMLElement>('[data-interlude]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, x: -40 },
          {
            opacity: 1,
            x: 0,
            duration: 1.2,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          },
        )
      })
    }, root)
    return () => ctx.revert()
  }, [works])

  return (
    <div ref={root} className="relative mx-auto max-w-[1600px] px-6 md:px-12">
      <div className="mb-20 flex items-end justify-between md:mb-32">
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold)/0.9)]">The Salon</p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-light italic leading-none text-[hsl(var(--cream))]">
            Hung for wandering
          </h2>
        </div>
        <p className="hidden max-w-xs text-right text-xs leading-relaxed text-[hsl(var(--cream)/0.45)] md:block">
          No grids, no rows. Each piece hangs where the eye would rest — follow the wall the way you would follow a
          conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-12 md:gap-x-8 md:gap-y-0">
        {works.map((work, i) => {
          const p = placements[i % placements.length]
          const speed = [0.4, 0.9, 0.15, 0.7, 0.3, 1, 0.55, 0.2, 0.8][i % 9]
          return (
            <div key={work.id} className={`relative ${p.wrap}`}>
              {interludes[i] && (
                <span
                  data-interlude
                  className="font-display pointer-events-none absolute -top-14 left-0 z-10 select-none text-[clamp(2.5rem,6vw,5rem)] font-light italic text-[hsl(var(--gold)/0.5)]"
                >
                  {interludes[i]}
                </span>
              )}
              <div data-wall-speed={speed}>
                <div data-wall-item>
                  <div className={`w-full ${p.aspect}`}>
                    <WorkCard work={work} index={i} className="h-full w-full" onOpen={(el) => onOpen(work, el)} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="font-display text-sm italic text-[hsl(var(--cream)/0.75)]">{work.title}</span>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.35)]">
                      {work.tags[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
