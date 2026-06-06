import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticlesBackground() {
  const ref = useRef()
  const { pointer } = useThree()

  const [positions, colors] = useMemo(() => {
    const count = 2000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#6D5040'),
      new THREE.Color('#927C6E'),
      new THREE.Color('#D5D0CA'),
      new THREE.Color('#342218'),
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
    }
    return [pos, col]
  }, [])

  const mouseTarget = useRef({ x: 0, y: 0 })

  useFrame(() => {
    if (!ref.current) return
    mouseTarget.current.x += (pointer.x * 0.5 - mouseTarget.current.x) * 0.05
    mouseTarget.current.y += (pointer.y * 0.5 - mouseTarget.current.y) * 0.05
    ref.current.rotation.y += mouseTarget.current.x * 0.001
    ref.current.rotation.x += mouseTarget.current.y * 0.001
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        sizeAttenuation
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexColors
      />
    </points>
  )
}