import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Zap, Palette, Camera, Users, MessageCircle, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Real-time Interactions',
    description: 'Watch likes, comments, and shares flow in as they happen. No refresh needed — instant engagement at your fingertips.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Palette,
    title: 'Beautiful Profiles',
    description: 'Customize your space with themes, layouts, and colors. Your profile is your canvas — make it unforgettable.',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: Camera,
    title: 'Creator Tools',
    description: 'Edit, filter, and enhance your content with pro-grade tools built right into the platform. No third-party apps needed.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: Users,
    title: 'Communities',
    description: 'Find your tribe in thousands of niche communities. Share, learn, and grow alongside people who get you.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400',
  },
  {
    icon: MessageCircle,
    title: 'Private Messaging',
    description: 'Connect one-on-one with end-to-end encryption. Share moments, collaborate, and build real relationships.',
    gradient: 'from-rose-500/20 to-red-500/20',
    iconColor: 'text-rose-400',
  },
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Discover content tailored to your taste. Our AI learns what you love and serves you more of it, perfectly curated.',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    iconColor: 'text-indigo-400',
  },
]

const floatingOrbs = [
  { size: 600, x: '10%', y: '20%', color: 'bg-blue-500/10', delay: 0, duration: 8 },
  { size: 400, x: '70%', y: '10%', color: 'bg-purple-500/10', delay: 2, duration: 10 },
  { size: 500, x: '40%', y: '60%', color: 'bg-cyan-500/8', delay: 4, duration: 12 },
]

export default function FeaturesSection() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-66.666%'])

  return (
    <section ref={sectionRef} className="relative min-h-screen py-32 overflow-hidden">
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${orb.color} pointer-events-none`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            filter: 'blur(80px)',
          }}
          animate={{
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
      <div className="sticky top-32 z-10">
        <motion.h2
          className="text-5xl md:text-7xl font-bold text-center mb-20 text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Everything You
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"> Need</span>
        </motion.h2>
      </div>

      <div className="relative z-10">
        <motion.div
          className="flex gap-8 pl-[50vw] will-change-transform"
          style={{ x }}
        >
          {[...features, ...features].map((feature, i) => (
            <motion.div
              key={i}
              className={`w-96 h-96 flex-shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group cursor-default transition-colors duration-500`}
              whileHover={{ y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient}`}
              />
              <div className="relative z-10 flex flex-col h-full">
                <div className={`w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mt-6 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed flex-1">
                  {feature.description}
                </p>
                <motion.div
                  className="h-1 w-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full group-hover:w-full transition-all duration-500 mt-auto"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
