import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    handle: '@sarahcreates',
    role: 'Digital Artist',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    text: 'VibeSnaps completely transformed how I share my art. The community is incredibly supportive!',
    offset: 0,
  },
  {
    name: 'Marcus Johnson',
    handle: '@marcus_photo',
    role: 'Photographer',
    avatar: 'https://i.pravatar.cc/150?u=marcus',
    text: 'The best platform for photographers who want real engagement, not just likes.',
    offset: 100,
  },
  {
    name: 'Elena Rodriguez',
    handle: '@elena_writes',
    role: 'Content Writer',
    avatar: 'https://i.pravatar.cc/150?u=elena',
    text: 'I found my audience here. The tools for creators are unmatched.',
    offset: 50,
  },
  {
    name: 'Alex Kim',
    handle: '@alex_designs',
    role: 'UI Designer',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    text: 'Finally, a platform that puts creativity over algorithms. This is where design belongs.',
    offset: 150,
  },
]

function TestimonialCard({ testimonial, index }) {
  const cardRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [testimonial.offset, -testimonial.offset])

  return (
    <motion.div
      ref={cardRef}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 max-w-md group cursor-default"
      style={{ y }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ rotateX: 2, rotateY: 2 }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      >
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
          <Quote className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-gray-300 leading-relaxed mb-6 text-lg">
          "{testimonial.text}"
        </p>
        <div className="flex items-center gap-4">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
          />
          <div>
            <div className="font-semibold text-white">{testimonial.name}</div>
            <div className="text-sm text-gray-400">{testimonial.role}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="py-32 relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-transparent to-gray-950 pointer-events-none" />
      <motion.h2
        className="text-4xl md:text-6xl font-bold text-center w-full mb-20 text-white relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Loved by{' '}
        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Creators
        </span>
      </motion.h2>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">
        {testimonials.map((t, i) => (
          <TestimonialCard key={t.name} testimonial={t} index={i} />
        ))}
      </div>
    </section>
  )
}
