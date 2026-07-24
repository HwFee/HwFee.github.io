import Hero from '@/sections/Hero'
import SalonWall from '@/sections/SalonWall'
import CollectionsTeaser from '@/sections/CollectionsTeaser'
import { works, categories, getWork } from '@/lib/works'
import { useViewer } from '@/components/gallery/ViewerContext'
import type { Work } from '@/types/work'

export default function Home() {
  const { openViewer } = useViewer()
  const featured = getWork('after-hours') ?? works[0]

  const openFromWall = (work: Work, el: HTMLElement) =>
    openViewer(works, works.findIndex((w) => w.id === work.id), el)

  return (
    <main>
      <Hero featured={featured} onOpen={(el) => openFromWall(featured, el)} />

      <section className="relative py-28 md:py-40">
        <SalonWall works={works} onOpen={openFromWall} />
      </section>

      <section className="relative pb-28 pt-8 md:pb-40">
        <CollectionsTeaser categories={categories} />
      </section>

      <footer className="border-t border-[hsl(var(--cream)/0.08)] px-6 py-14 md:px-12">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="font-display text-4xl font-light italic text-[hsl(var(--cream))] md:text-5xl">Curio</p>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[hsl(var(--cream)/0.45)]">
              A small gallery with tall ceilings. New pieces arrive quietly; the walls rearrange themselves around them.
            </p>
          </div>
          <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.4)]">
            <span>{works.length} works</span>
            <span className="h-3 w-px bg-[hsl(var(--cream)/0.2)]" />
            <span>{categories.length} rooms</span>
            <span className="h-3 w-px bg-[hsl(var(--cream)/0.2)]" />
            <span>est. 2026</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
