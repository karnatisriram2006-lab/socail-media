import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, Zap, Shield, Smile } from 'lucide-react'

const reasons = [
  { icon: Sparkles, title: 'Designed for Creators', description: 'Everything you need to showcase your work and build your audience in one place.' },
  { icon: Zap, title: 'Blazing Fast Performance', description: 'Optimized for speed with instant loading, smooth animations, and real-time updates.' },
  { icon: Shield, title: 'Safe & Inclusive', description: 'Advanced moderation tools and community guidelines keep everyone safe.' },
  { icon: Smile, title: 'Supportive Community', description: 'Join a community that celebrates creativity and supports every creator.' },
]

export default function WhySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-gradient-to-b from-black to-warm-950/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-warm-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Why Creators Choose{' '}
              <span className="bg-gradient-to-r from-warm-400 to-warm-200 bg-clip-text text-transparent">
                VibeSnaps
              </span>
            </h2>
            <p className="text-warm-300 mb-8 text-lg">
              We're building the most creator-friendly platform on the internet. 
              Here's why thousands of creators make VibeSnaps their home.
            </p>
            <div className="space-y-6">
              {reasons.map((reason, i) => (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 bg-warm-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <reason.icon className="w-5 h-5 text-warm-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">{reason.title}</h3>
                    <p className="text-sm text-warm-300">{reason.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-warm-500/10 to-warm-400/10 border border-white/5 p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-7xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold mb-2 text-white">Join the Movement</h3>
                <p className="text-warm-300">Be part of the next generation of social creativity</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}