import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AlertTriangle, Clock, BarChart3 } from 'lucide-react'
import useTilt from '../../hooks/useTilt'

const stats = [
  {
    value: '85%',
    label: 'of users feel social media is overwhelming',
    icon: AlertTriangle,
    color: 'text-warm-400',
    bg: 'bg-warm-500/10',
    from: 'left',
  },
  {
    value: '2.5 hrs',
    label: 'The average person spends scrolling without meaning',
    icon: Clock,
    color: 'text-warm-300',
    bg: 'bg-warm-500/10',
    from: 'bottom',
  },
  {
    value: '70%',
    label: 'of creators say algorithms hurt their reach',
    icon: BarChart3,
    color: 'text-warm-200',
    bg: 'bg-warm-500/10',
    from: 'right',
  },
]

const cardVariants = {
  left: {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  },
  bottom: {
    hidden: { opacity: 0, y: 80 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  },
  right: {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  },
}

function TiltCard({ stat, i }) {
  const tilt = useTilt()
  const Icon = stat.icon

  return (
    <motion.div
      key={stat.label}
      variants={cardVariants[stat.from]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      transition={{ delay: i * 0.2 }}
    >
      <motion.div
        ref={tilt.ref}
        onMouseMove={tilt.handleMouse}
        onMouseEnter={tilt.handleEnter}
        onMouseLeave={tilt.handleLeave}
        className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500"
      >
        <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center mb-6`}>
          <Icon className={`w-7 h-7 ${stat.color}`} />
        </div>
        <div className="text-5xl md:text-6xl font-bold text-white mb-3">{stat.value}</div>
        <p className="text-warm-300 text-lg leading-relaxed">{stat.label}</p>
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 group-hover:ring-warm-500/20 transition-all duration-500" />
      </motion.div>
    </motion.div>
  )
}

export default function StorySection() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const bgOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.6, 0.3])
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.2, 0.5], [0, 1, 1])
  const headlineColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6],
    ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']
  )
  const subOpacity = useTransform(scrollYProgress, [0.2, 0.4, 0.7], [0, 1, 0.6])

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden py-32 bg-black"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black via-warm-950/40 to-black"
        style={{ opacity: bgOpacity }}
      />

      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-warm-500/10 blur-[120px]"
        style={{ opacity: bgOpacity }}
      />
      <motion.div
        className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-warm-400/10 blur-[120px]"
        style={{ opacity: bgOpacity }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.h2
          style={{ color: headlineColor, opacity: headlineOpacity }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-center mb-6 leading-tight"
        >
          Social media became noisy.
        </motion.h2>

        <motion.p
          style={{ opacity: subOpacity }}
          className="text-xl md:text-2xl text-warm-300/70 text-center mb-24 max-w-3xl mx-auto"
        >
          We're building something different.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <TiltCard key={stat.label} stat={stat} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}