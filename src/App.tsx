import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { useLenis } from '@/hooks/useLenis'
import CursorGlow from '@/components/gallery/CursorGlow'
import Nav from '@/components/gallery/Nav'
import { ViewerProvider } from '@/components/gallery/ViewerContext'
import Home from '@/pages/Home'
import Collections from '@/pages/Collections'
import CategoryDetail from '@/pages/CategoryDetail'

function ScrollManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  useLenis()
  return (
    <ViewerProvider>
      <CursorGlow />
      <Nav />
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:name" element={<CategoryDetail />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </ViewerProvider>
  )
}
