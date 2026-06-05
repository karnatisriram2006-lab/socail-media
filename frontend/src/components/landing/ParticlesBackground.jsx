import { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticlesBackground() {
  const ref = useRef()
  const { pointer } = useThree()

  const [positions, colors, sizes] = useMemo(() => {
    const count = 5000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const palette = [
      new THREE.Color('#3b82f6'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#6366f1'),
      new THREE.Color('#a855f7'),
    ]
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = 15 + Math.random() * 35
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = radius * Math.cos(phi)
      const c = palette[Math.floor(Math.random() * palette.length)]
        .clone()
        .multiplyScalar(0.4 + Math.random() * 0.6)
      col[i3] = c.r
      col[i3 + 1] = c.g
      col[i3 + 2] = c.b
      siz[i] = 0.05 + Math.random() * 0.15
    }
    return [pos, col, siz]
  }, [])

  const mouseTarget = useRef({ x: 0, y: 0 })

  const rotSpeed = useRef({ x: 0.0002, y: 0.0003 })

  useFrame((_, delta) => {
    if (!ref.current) return
    mouseTarget.current.x += (pointer.x * 0.5 - mouseTarget.current.x) * 0.02
    mouseTarget.current.y += (pointer.y * 0.5 - mouseTarget.current.y) * 0.02
    ref.current.rotation.x += (mouseTarget.current.y * 0.005 + rotSpeed.current.x - ref.current.rotation.x) * delta * 0.5
    ref.current.rotation.y += (mouseTarget.current.x * 0.005 + rotSpeed.current.y - ref.current.rotation.y) * delta * 0.5
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexColors
      />
    </points>
  )
}
