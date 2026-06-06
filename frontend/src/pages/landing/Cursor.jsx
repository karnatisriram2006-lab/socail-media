import { useEffect, useRef, useCallback } from 'react'

export default function Cursor() {
  const cursorRef = useRef(null)
  const posRef = useRef({ x: -100, y: -100 })
  const scaleRef = useRef(1)
  const rafRef = useRef(null)

  const updateCursor = useCallback(() => {
    if (!cursorRef.current) return
    cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scale(${scaleRef.current})`
    rafRef.current = null
  }, [])

  const scheduleUpdate = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(updateCursor)
    }
  }, [updateCursor])

  useEffect(() => {
    const handleMouse = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      scheduleUpdate()
    }

    const handleMouseDown = () => {
      scaleRef.current = 0.8
      scheduleUpdate()
    }

    const handleMouseUp = () => {
      scaleRef.current = 1
      scheduleUpdate()
    }

    const handleHover = (e) => {
      if (e.target.closest('a, button, [data-hoverable]')) {
        scaleRef.current = 1.8
        scheduleUpdate()
      }
    }

    const handleHoverOut = (e) => {
      if (e.target.closest('a, button, [data-hoverable]')) {
        scaleRef.current = 1
        scheduleUpdate()
      }
    }

    window.addEventListener('mousemove', handleMouse, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseover', handleHover)
    document.addEventListener('mouseout', handleHoverOut)

    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseover', handleHover)
      document.removeEventListener('mouseout', handleHoverOut)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scheduleUpdate])

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none hidden md:block will-change-transform"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 rounded-full border border-white/40 bg-white/[0.08] backdrop-blur-sm" />
      </div>
    </div>
  )
}
