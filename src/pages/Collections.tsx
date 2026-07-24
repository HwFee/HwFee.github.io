import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { categories } from '@/lib/works'
import { useViewer } from '@/components/gallery/ViewerContext'

gsap.registerPlugin(ScrollTrigger)

/** Collections index — each room is a spatial cluster of its works. */
export default function Collections() {
  const root = useRef<HTMLDivElement>(null)
  const { openViewer } = useViewer()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-room]').forEach((room) => {
        gsap.fromTo(
          room.querySelectorAll('[data-room-img]'),
          { y: 80, opacity: 0, rotate: 0 },
          {
            y: 0,
            opacity: 1,
            rotate: (i: number) => [-3, 2, -1.5, 3][i % 4],
            duration: 1.2,
            stagger: 0.12,
            ease: 'expo.out',
            scrollTrigger: { trigger: room, start: 'top 75%' },
          },
        )
        gsap.fromTo(
          room.querySelector('[data-room-title]'),
          { yPercent: 60, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'expo.out',
            scrollTrigger: { trigger: room, start: 'top 80%' },
          },
        )
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <main ref={root} className="mx-auto max-w-[1600px] px-6 pb-32 pt-32 md:px-12 md:pt-40">
      <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold)/0.9)]">Index</p>
      <h1 className="font-display mb-6 text-[clamp(2.5rem,7vw,6.5rem)] font-light italic leading-[0.95] text-[hsl(var(--cream))]">
        Collections
      </h1>
      <p className="mb-24 max-w-md text-sm leading-relaxed text-[hsl(var(--cream)/0.5)]">
        The house sorts itself. Every tag a work carries becomes a wall; enough walls of one kind become a room. Add a
        piece and the architecture quietly shifts to hold it.
      </p>

      <div className="flex flex-col gap-32 md:gap-44">
        {categories.map((cat, ci) => (
          <section key={cat.name} data-room className="relative">
            {/* room cluster — works overlap in space, not in rows */}
            <div className="relative flex min-h-[40vh] items-center md:min-h-[48vh]">
              <div className="relative z-10 flex w-full flex-wrap items-center gap-0">
                {cat.works.slice(0, 4).map((w, i) => {
                  const sizes = ['w-[46%] md:w-[26%]', 'w-[38%] md:w-[20%] -ml-[8%] mt-16', 'w-[42%] md:w-[23%] -ml-[6%] -mt-10', 'w-[34%] md:w-[18%] -ml-[7%] mt-24']
                  return (
                    <div
                      key={w.id}
                      data-room-img
                      data-work-id={w.id}
                      data-cursor="view"
                      onClick={(e) => openViewer(cat.works, cat.works.findIndex((x) => x.id === w.id), e.currentTarget)}
                      className={`group relative overflow-hidden rounded-[2px] shadow-[0_40px_90px_-25px_hsl(224_34%_2%/0.95)] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:z-20 hover:scale-[1.04] hover:!rotate-0 ${sizes[i % 4]}`}
                      style={{ aspectRatio: '3/4' }}
                    >
                      <img
                        src={w.image}
                        alt={w.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--ink)/0.5)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <span className="font-display absolute bottom-3 left-3 text-sm italic text-[hsl(var(--cream))] opacity-0 transition-all duration-500 group-hover:opacity-100">
                        {w.title}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* giant title behind the cluster */}
              <h2
                data-room-title
                className={`font-display pointer-events-none absolute z-0 select-none text-[clamp(3.5rem,13vw,12rem)] font-light uppercase leading-none tracking-[0.02em] text-outline ${
                  ci % 2 ? 'right-0 text-right' : 'left-0'
                } top-1/2 -translate-y-1/2`}
              >
                {cat.name}
              </h2>
            </div>

            {/* room footer */}
            <div className={`mt-10 flex flex-wrap items-center gap-4 ${ci % 2 ? 'md:justify-end' : ''}`}>
              <Link
                to={`/collections/${encodeURIComponent(cat.name)}`}
                data-cursor="link"
                className="group flex items-center gap-4 border border-[hsl(var(--cream)/0.15)] px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.75)] transition-all duration-500 hover:border-[hsl(var(--gold)/0.6)] hover:text-[hsl(var(--gold))]"
              >
                Enter the room
                <span className="inline-block transition-transform duration-500 group-hover:translate-x-2">→</span>
              </Link>
              {cat.subcategories.map((s) => (
                <span
                  key={s.name}
                  className="rounded-full border border-[hsl(var(--cream)/0.1)] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--cream)/0.45)]"
                >
                  {s.name} · {s.works.length}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
