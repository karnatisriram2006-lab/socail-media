import { useRef } from 'react'
import { motion } from 'framer-motion'

const floatingAvatars = [
  { src: 'https://i.pravatar.cc/150?u=a1', x: '-20%', y: '-30%', delay: 0 },
  { src: 'https://i.pravatar.cc/150?u=a2', x: '25%', y: '-40%', delay: 0.3 },
  { src: 'https://i.pravatar.cc/150?u=a3', x: '-35%', y: '15%', delay: 0.6 },
  { src: 'https://i.pravatar.cc/150?u=a4', x: '30%', y: '25%', delay: 0.9 },
  { src: 'https://i.pravatar.cc/150?u=a5', x: '-15%', y: '40%', delay: 1.2 },
  { src: 'https://i.pravatar.cc/150?u=a6', x: '40%', y: '-15%', delay: 1.5 },
  { src: 'https://i.pravatar.cc/150?u=a7', x: '-40%', y: '-10%', delay: 1.8 },
  { src: 'https://i.pravatar.cc/150?u=a8', x: '20%', y: '45%', delay: 2.1 },
  { src: 'https://i.pravatar.cc/150?u=a9', x: '-25%', y: '-45%', delay: 2.4 },
  { src: 'https://i.pravatar.cc/150?u=a10', x: '45%', y: '5%', delay: 2.7 },
]

const gradientBlobs = [
  { size: 600, x: '20%', y: '20%', color: 'from-blue-500/20', duration: 10, delay: 0 },
  { size: 500, x: '70%', y: '60%', color: 'from-purple-500/20', duration: 12, delay: 2 },
  { size: 400, x: '40%', y: '80%', color: 'from-cyan-500/20', duration: 8, delay: 4 },
]

export default function CommunitySection() {
  return (
    <section className="relative min-h-screen py-32 flex items-center justify-center overflow-hidden">
      {gradientBlobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-b ${blob.color} to-transparent pointer-events-none`}
          style={{
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: blob.delay,
          }}
        />
      ))}
      <div className="relative z-10 text-center">
        <motion.h2
          className="text-7xl md:text-9xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Find Your{' '}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            People.
          </span>
        </motion.h2>
        <motion.p
          className="text-xl text-gray-400 mt-6 max-w-2xl mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Join 10,000+ communities built around real connections.
        </motion.p>
        <div className="relative h-64 mt-16 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-lg h-full">
              {floatingAvatars.map((avatar, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  style={{ translateX: '-50%', translateY: '-50%' }}
                  initial={{ x: 0, y: 0 }}
                  animate={{
                    x: [0, avatar.x, 0],
                    y: [0, avatar.y, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: avatar.delay,
                  }}
                >
                  <motion.img
                    src={avatar.src}
                    alt=""
                    className="w-16 h-16 rounded-full border-2 border-white/20 object-cover hover:border-blue-400 transition-colors duration-300"
                    whileHover={{ scale: 1.2, borderColor: 'rgba(96, 165, 250, 1)' }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
