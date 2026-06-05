import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'

export default function useLenis() {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    lenisRef.current = lenis

    gsap.ticker.lagSmoothing(0)
    gsap.ticker.add((time) => lenis.raf(time * 1000))

    return () => {
      lenis.destroy()
      gsap.ticker.lagSmoothing(1)
    }
  }, [])

  return lenisRef
}
