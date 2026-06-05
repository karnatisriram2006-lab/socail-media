import { useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
  secondary: 'border border-white/20 text-white/80 hover:bg-white/5 hover:text-white',
}

export default function MagneticButton({ children, href, variant = 'primary', className = '' }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouse = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const dist = Math.sqrt(x * x + y * y)
    const maxDist = 100
    const strength = Math.min(1, dist / maxDist)
    setPosition({
      x: x * 0.3 * strength,
      y: y * 0.3 * strength,
    })
  }, [])

  const handleLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 })
    setIsHovered(false)
  }, [])

  const Component = href ? motion.a : motion.button

  return (
    <Component
      ref={ref}
      href={href}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleLeave}
      animate={{
        x: position.x,
        y: position.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-semibold transition-colors duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </Component>
  )
}
