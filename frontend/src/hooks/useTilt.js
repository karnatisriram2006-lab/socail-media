import { useRef, useCallback } from 'react'

export default function useTilt() {
  const ref = useRef(null)
  const tiltRef = useRef({ x: 0, y: 0 })
  const isHoveredRef = useRef(false)
  const rafRef = useRef(null)

  const updateTilt = useCallback(() => {
    if (!ref.current) return
    const { x, y } = tiltRef.current
    ref.current.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg)`
    rafRef.current = null
  }, [])

  const scheduleUpdate = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(updateTilt)
    }
  }, [updateTilt])

  const handleMouse = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    tiltRef.current = { x: x * 15, y: -y * 15 }
    scheduleUpdate()
  }, [scheduleUpdate])

  const handleLeave = useCallback(() => {
    tiltRef.current = { x: 0, y: 0 }
    isHoveredRef.current = false
    scheduleUpdate()
  }, [scheduleUpdate])

  const handleEnter = useCallback(() => {
    isHoveredRef.current = true
  }, [])

  return {
    ref,
    handleMouse,
    handleLeave,
    handleEnter,
  }
}