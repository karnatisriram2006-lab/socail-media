import { useMemo, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function GradientMesh() {
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  useEffect(() => {
    const handleMouse = (e) => {
      mouseX.set(e.clientX / window.innerWidth)
      mouseY.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', handleMouse, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [mouseX, mouseY])

  const orbs = useMemo(() => [
    { size: 600, color: 'rgba(109, 80, 64, 0.12)', blur: 120, startX: 10, startY: 10, endX: 20, endY: 30 },
    { size: 400, color: 'rgba(146, 124, 110, 0.1)', blur: 100, startX: 70, startY: 60, endX: 50, endY: 40 },
    { size: 500, color: 'rgba(52, 34, 24, 0.15)', blur: 140, startX: 40, startY: 20, endX: 55, endY: 35 },
    { size: 300, color: 'rgba(213, 208, 202, 0.08)', blur: 80, startX: 80, startY: 80, endX: 65, endY: 65 },
  ], [])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            width: orb.size,
            height: orb.size,
            filter: `blur(${orb.blur}px)`,
            background: orb.color,
            x: smoothX,
            y: smoothY,
          }}
          animate={{
            x: [`${orb.startX}vw`, `${orb.endX}vw`],
            y: [`${orb.startY}vh`, `${orb.endY}vh`],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}