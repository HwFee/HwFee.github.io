import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import WorkCard from '@/components/gallery/WorkCard'
import { categories } from '@/lib/works'
import { useViewer } from '@/components/gallery/ViewerContext'
import type { Work } from '@/types/work'

gsap.registerPlugin(ScrollTrigger)

/** One room of the house: hero wall + subcategory corridors. */
export default function CategoryDetail() {
  const { name } = useParams()
  const category = categories.find((c) => c.name === name)
  const { openViewer } = useViewer()
  const root = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<string | null>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-cd-title]', { yPercent: 110 }, { yPercent: 0, duration: 1.3, ease: 'expo.out', delay: 0.15 })
      gsap.fromTo('[data-cd-cover]', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'expo.out' })
      gsap.fromTo('[data-cd-cover] img', { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out' })
      gsap.utils.toArray<HTMLElement>('[data-cd-item]').forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 70, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            delay: (i % 3) * 0.08,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          },
        )
      })
      gsap.to('[data-cd-cover] img', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: '[data-cd-hero]', start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [name])

  if (!category) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-display text-4xl italic text-[hsl(var(--cream))]">This room doesn't exist yet.</p>
        <Link to="/collections" data-cursor="link" className="text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--gold))]">
          ← Back to collections
        </Link>
      </main>
    )
  }

  const shown: Work[] = filter ? category.works.filter((w) => w.tags[1] === filter) : category.works

  return (
    <main ref={root}>
      {/* hero wall */}
      <section data-cd-hero className="relative flex h-[72svh] items-end overflow-hidden">
        <div data-cd-cover className="absolute inset-0">
          <img src={category.cover.image} alt="" className="h-full w-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--ink))] via-[hsl(var(--ink)/0.25)] to-[hsl(var(--ink)/0.35)]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-14 md:px-12">
          <Link
            to="/collections"
            data-cursor="link"
            className="mb-6 inline-block text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--cream)/0.6)] transition-colors hover:text-[hsl(var(--gold))]"
          >
            ← Collections
          </Link>
          <div className="overflow-hidden">
            <h1
              data-cd-title
              className="font-display text-[clamp(3rem,10vw,9rem)] font-light italic leading-[0.95] text-[hsl(var(--cream))]"
            >
              {category.name}
            </h1>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.55)]">
            {category.works.length} {category.works.length === 1 ? 'work' : 'works'} hanging in this room
          </p>
        </div>
      </section>

      {/* subcategory corridors */}
      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-12 md:py-24">
        {category.subcategories.length > 0 && (
          <div className="mb-14 flex flex-wrap items-center gap-3">
            <button
              data-cursor="link"
              onClick={() => setFilter(null)}
              className={`rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.25em] transition-all duration-500 ${
                filter === null
                  ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                  : 'border-[hsl(var(--cream)/0.15)] text-[hsl(var(--cream)/0.5)] hover:border-[hsl(var(--cream)/0.4)] hover:text-[hsl(var(--cream))]'
              }`}
            >
              All
            </button>
            {category.subcategories.map((s) => (
              <button
                key={s.name}
                data-cursor="link"
                onClick={() => setFilter(s.name === filter ? null : s.name)}
                className={`rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.25em] transition-all duration-500 ${
                  filter === s.name
                    ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                    : 'border-[hsl(var(--cream)/0.15)] text-[hsl(var(--cream)/0.5)] hover:border-[hsl(var(--cream)/0.4)] hover:text-[hsl(var(--cream))]'
                }`}
              >
                {s.name} · {s.works.length}
              </button>
            ))}
          </div>
        )}

        {/* irregular hang */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((w, i) => (
            <div key={w.id} data-cd-item className={i % 3 === 1 ? 'lg:mt-20' : i % 3 === 2 ? 'lg:mt-40' : ''}>
              <div className={i % 2 ? 'aspect-[3/4]' : 'aspect-[4/5]'}>
                <WorkCard
                  work={w}
                  index={i}
                  className="h-full w-full"
                  onOpen={(el) => openViewer(shown, shown.findIndex((x) => x.id === w.id), el)}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-base italic text-[hsl(var(--cream)/0.8)]">{w.title}</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.35)]">
                  {w.tags[1] ?? w.tags[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
