import { useRef, useState } from 'react'
import type { Work } from '@/types/work'

interface Props {
  work: Work
  index?: number
  onOpen?: (el: HTMLElement) => void
  className?: string
  style?: React.CSSProperties
}

/** Gallery card — 3D tilt, golden sheen on hover, blur-up image reveal. */
export default function WorkCard({ work, index = 0, onOpen, className = '', style }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.transform = `perspective(1100px) rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 8}deg) translateZ(0) scale(1.015)`
    el.style.setProperty('--sheen-x', `${px * 100}%`)
    el.style.setProperty('--sheen-y', `${py * 100}%`)
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(1100px) rotateY(0deg) rotateX(0deg) scale(1)'
  }

  return (
    <div
      ref={ref}
      data-work-id={work.id}
      data-cursor="view"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => ref.current && onOpen?.(ref.current)}
      className={`group relative select-none overflow-hidden rounded-[2px] bg-[hsl(var(--ink-soft))] transition-[box-shadow] duration-500 will-change-transform hover:shadow-[0_30px_80px_-20px_hsl(224_34%_4%/0.9),0_0_0_1px_hsl(var(--gold)/0.35)] ${className}`}
      style={{ transition: 'transform .5s cubic-bezier(.22,1,.36,1), box-shadow .5s ease', ...style }}
    >
      {/* blurred placeholder layer */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl transition-opacity duration-700"
        style={{ backgroundImage: `url(${work.image})`, opacity: loaded ? 0 : 0.5 }}
      />
      <img
        src={work.image}
        alt={work.title}
        loading={index > 3 ? 'lazy' : 'eager'}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06] ${
          loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
        }`}
        draggable={false}
      />
      {/* hover sheen following the pointer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--sheen-x,50%) var(--sheen-y,50%), hsl(40 58% 72% / 0.16), transparent 65%)',
        }}
      />
      {/* index numeral */}
      <span className="font-display absolute right-3 top-2 text-xs italic tracking-widest text-[hsl(var(--cream)/0.0)] transition-colors duration-500 group-hover:text-[hsl(var(--gold)/0.9)]">
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
  )
}
