import { Link, useLocation } from 'react-router'
import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const item = (to: string, label: string) => (
    <Link
      to={to}
      data-cursor="link"
      className={`relative text-[11px] uppercase tracking-[0.3em] transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-[hsl(var(--gold))] after:transition-all after:duration-500 ${
        pathname === to
          ? 'text-[hsl(var(--gold))] after:w-full'
          : 'text-[hsl(var(--cream)/0.6)] after:w-0 hover:text-[hsl(var(--cream))] hover:after:w-full'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        scrolled
          ? 'bg-[hsl(var(--ink)/0.72)] backdrop-blur-md [box-shadow:0_1px_0_hsl(var(--cream)/0.07)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" data-cursor="link" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-light italic tracking-wide text-[hsl(var(--cream))]">
            Curio
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--gold)/0.8)] sm:inline">
            gallery
          </span>
        </Link>
        <nav className="flex items-center gap-8">
          {item('/', 'Salon')}
          {item('/collections', 'Collections')}
        </nav>
      </div>
    </header>
  )
}
