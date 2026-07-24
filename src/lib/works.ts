import type { Work, Category } from '@/types/work'

const modules = import.meta.glob<Work>('../data/works/*.json', {
  eager: true,
  import: 'default',
})

export const works: Work[] = Object.values(modules).sort((a, b) =>
  b.addedAt.localeCompare(a.addedAt),
)

/** Aggregate categories from tags — no separate config ever needed.
 *  tags[0] = primary category, tags[1] (optional) = subcategory. */
export const categories: Category[] = (() => {
  const map = new Map<string, Work[]>()
  for (const w of works) {
    const primary = w.tags[0]
    if (!primary) continue
    if (!map.has(primary)) map.set(primary, [])
    map.get(primary)!.push(w)
  }
  return [...map.entries()]
    .map(([name, list]) => {
      const subs = new Map<string, Work[]>()
      for (const w of list) {
        const sub = w.tags[1]
        if (!sub) continue
        if (!subs.has(sub)) subs.set(sub, [])
        subs.get(sub)!.push(w)
      }
      return {
        name,
        works: list,
        subcategories: [...subs.entries()].map(([n, l]) => ({ name: n, works: l })),
        cover: list[0],
      }
    })
    .sort((a, b) => b.works.length - a.works.length || a.name.localeCompare(b.name))
})()

export function getWork(id: string): Work | undefined {
  return works.find((w) => w.id === id)
}
