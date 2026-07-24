import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Slow golden dust drifting in a dark void; reacts subtly to the pointer. */
function Particles({ count = 700 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  const mouse = useRef({ x: 0, y: 0 })

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
      seeds[i] = Math.random() * Math.PI * 2
    }
    return { positions, seeds }
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const p = points.current
    if (!p) return
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      arr[i * 3 + 1] += Math.sin(t * 0.22 + s) * 0.0012
      arr[i * 3] += Math.cos(t * 0.16 + s * 1.7) * 0.0009
    }
    p.geometry.attributes.position.needsUpdate = true
    p.rotation.y = THREE.MathUtils.lerp(p.rotation.y, mouse.current.x * 0.06, 0.03)
    p.rotation.x = THREE.MathUtils.lerp(p.rotation.x, -mouse.current.y * 0.04, 0.03)
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#d8b36a"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function DustField({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      onMouseMove={() => {}}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Particles />
      </Canvas>
    </div>
  )
}
