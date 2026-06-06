import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-warm-500 text-white shadow-lg shadow-warm-500/25 hover:bg-warm-400 hover:shadow-warm-400/40',
  secondary: 'border border-warm-500/20 text-warm-300/80 hover:bg-warm-500/10 hover:text-warm-200',
}

export default function MagneticButton({ children, href, onClick, variant = 'primary', className = '' }) {
  const ref = useRef(null)
  const posRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  const updateMagnet = useCallback(() => {
    if (!ref.current) return
    const { x, y } = posRef.current
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${x === 0 && y === 0 ? 1 : 1.05})`
    rafRef.current = null
  }, [])

  const scheduleUpdate = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(updateMagnet)
    }
  }, [updateMagnet])

  const handleMouse = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const dist = Math.sqrt(x * x + y * y)
    const strength = Math.min(1, dist / 100)
    posRef.current = { x: x * 0.3 * strength, y: y * 0.3 * strength }
    scheduleUpdate()
  }, [scheduleUpdate])

  const handleLeave = useCallback(() => {
    posRef.current = { x: 0, y: 0 }
    scheduleUpdate()
  }, [scheduleUpdate])

  const Component = href ? motion.a : motion.button
  const extraProps = href ? { href } : { onClick }

  return (
    <Component
      ref={ref}
      {...extraProps}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-semibold transition-colors duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </Component>
  )
}