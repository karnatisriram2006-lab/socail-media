import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Image, Globe, Heart } from 'lucide-react'
import useTilt from '../../hooks/useTilt'

const stats = [
  { icon: Users, target: 10000000, label: 'Active Users', suffix: '+', prefix: '' },
  { icon: Image, target: 50000000, label: 'Posts Shared', suffix: '+', prefix: '' },
  { icon: Globe, target: 100000, label: 'Communities', suffix: '+', prefix: '' },
  { icon: Heart, target: 2000000000, label: 'Daily Interactions', suffix: '+', prefix: '' },
]

function formatNumber(n) {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
  if (n >= 1000000) return (n / 1000000).toFixed(0) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toString()
}

function AnimatedStat({ stat, isVisible, index }) {
  const [count, setCount] = useState(0)
  const tilt = useTilt()

  useEffect(() => {
    if (!isVisible) return
    setCount(0)
    const duration = 2000
    const steps = 40
    const increment = stat.target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= stat.target) {
        setCount(stat.target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [stat.target, isVisible])

  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.handleMouse}
      onMouseEnter={tilt.handleEnter}
      onMouseLeave={tilt.handleLeave}
      className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-12 text-center group hover:bg-white/[0.05] transition-colors duration-500"
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12 }}
    >
      <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-warm-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-warm-500/20 transition-all duration-300">
        <stat.icon className="w-7 h-7 text-warm-400" />
      </div>
      <div className="text-5xl md:text-6xl font-bold text-white mb-2 tabular-nums">
        {stat.prefix}{formatNumber(count)}{stat.suffix}
      </div>
      <div className="text-warm-300 text-lg">{stat.label}</div>
    </motion.div>
  )
}

export default function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: '-100px' })

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-gradient-to-b from-black to-warm-950/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-warm-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          className="text-4xl md:text-6xl font-bold text-center mb-20 text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Trusted by{' '}
          <span className="bg-gradient-to-r from-warm-400 to-warm-200 bg-clip-text text-transparent">
            Millions
          </span>
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <AnimatedStat key={stat.label} stat={stat} isVisible={isInView} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}