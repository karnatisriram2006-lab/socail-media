import { useEffect, useRef, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, Sparkles, ChevronDown } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import ParticlesBackground from '../../components/landing/ParticlesBackground'

const headlineWords = ['Connect', 'Beyond', 'Likes']

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.4 },
  },
}

const wordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

export default function HeroSection() {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouse = (e) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-black"
    >
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Canvas
            camera={{ position: [0, 0, 30], fov: 60 }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, alpha: true }}
          >
            <ParticlesBackground />
          </Canvas>
        </Suspense>
      </div>

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      <div
        ref={contentRef}
        style={{
          transform: `translate3d(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px, 0)`,
        }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-sm px-4 py-1.5 rounded-full mb-8 border border-white/10">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>The creator platform for everyone</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            <motion.span variants={containerVariants} className="inline-flex flex-wrap justify-center gap-x-4">
              {headlineWords.map((word) => (
                <motion.span
                  key={word}
                  variants={wordVariants}
                  className="bg-gradient-to-r from-white via-blue-400 to-purple-400 bg-clip-text text-transparent"
                >
                  {word}
                </motion.span>
              ))}
            </motion.span>
          </h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A new generation social platform built for creators, communities, and meaningful interactions.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:bg-blue-500 transition-all duration-300"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <button className="inline-flex items-center gap-3 border border-white/20 text-white/80 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/5 hover:text-white transition-all duration-300">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6 text-white/50" />
        </motion.div>
      </motion.div>
    </section>
  )
}
