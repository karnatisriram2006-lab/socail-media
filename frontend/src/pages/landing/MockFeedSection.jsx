import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart, MessageCircle, Bookmark } from 'lucide-react'

const posts = [
  { id: 1, user: 'luna_artistry', avatar: 'https://i.pravatar.cc/150?u=luna', image: 'https://picsum.photos/seed/art/600/600', caption: 'Golden hour magic captured through the lens. Every moment tells a story waiting to be shared.', initialLikes: 1423, comments: [{ user: 'creative_soul', text: 'This is absolutely stunning!' }, { user: 'visual_diaries', text: 'The lighting is perfect ✨' }], commentCount: 47 },
  { id: 2, user: 'urban_explorer', avatar: 'https://i.pravatar.cc/150?u=urban', image: 'https://picsum.photos/seed/city/600/600', caption: 'Found this hidden gem in the heart of the city. Architecture that takes your breath away.', initialLikes: 2891, comments: [{ user: 'wanderlust_diaries', text: 'Where is this located?' }, { user: 'city_scape', text: 'Brutalist beauty right there' }], commentCount: 83 },
  { id: 3, user: 'flora_dreamer', avatar: 'https://i.pravatar.cc/150?u=flora', image: 'https://picsum.photos/seed/garden/600/600', caption: 'Nature paints the best pictures. A little corner of paradise in my backyard.', initialLikes: 967, comments: [{ user: 'botanical_life', text: 'What flower is that?' }], commentCount: 24 },
  { id: 4, user: 'pixel_wanderer', avatar: 'https://i.pravatar.cc/150?u=pixel', image: 'https://picsum.photos/seed/ocean/600/600', caption: 'Chasing horizons and collecting moments. The ocean never disappoints.', initialLikes: 2104, comments: [{ user: 'wave_chaser', text: 'Incredible shot!' }, { user: 'coastal_vibes', text: 'Adding this to my bucket list' }], commentCount: 56 },
]

function AnimatedCount({ target, isVisible }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isVisible) return
    setCount(0)
    const duration = 1500
    const steps = 30
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else { setCount(Math.floor(current)) }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target, isVisible])
  return <span>{count.toLocaleString()}</span>
}

function PostCard({ post, index }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.initialLikes)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [counterVisible, setCounterVisible] = useState(false)

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setCounterVisible(true), 300 + index * 200)
      return () => clearTimeout(timer)
    }
  }, [isInView, index])

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount((c) => c - 1) }
    else { setLiked(true); setLikeCount((c) => c + 1) }
  }

  return (
    <motion.div
      ref={ref}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-colors duration-300"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <div className="p-4 flex items-center gap-3">
        <img src={post.avatar} alt={post.user} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
        <span className="text-sm font-semibold text-white">{post.user}</span>
      </div>
      <motion.div className="relative overflow-hidden" whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }}>
        <img src={post.image} alt="Post" className="aspect-square w-full object-cover bg-warm-950" />
        <motion.div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <motion.button onClick={handleLike} className="flex items-center gap-1.5 text-sm" whileTap={{ scale: 1.3 }}>
            <motion.div animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart className={`w-5 h-5 transition-colors duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-warm-300 hover:text-red-400'}`} />
            </motion.div>
            <span className="text-warm-300"><AnimatedCount target={likeCount} isVisible={counterVisible} /></span>
          </motion.button>
          <button className="flex items-center gap-1.5 text-sm text-warm-300 hover:text-white transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentCount}</span>
          </button>
          <button className="ml-auto text-warm-300 hover:text-white transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-warm-200"><span className="font-semibold text-white mr-2">{post.user}</span>{post.caption}</p>
        {post.comments.slice(0, 2).map((comment, ci) => (
          <p key={ci} className="text-sm text-warm-300"><span className="font-semibold text-warm-200 mr-2">{comment.user}</span>{comment.text}</p>
        ))}
      </div>
    </motion.div>
  )
}

export default function MockFeedSection() {
  return (
    <section className="relative min-h-screen py-32 bg-gradient-to-b from-black via-warm-950/30 to-black">
      <motion.h2
        className="text-4xl md:text-6xl font-bold text-center mb-16 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        See What's{' '}
        <span className="bg-gradient-to-r from-warm-400 to-warm-200 bg-clip-text text-transparent">
          Possible
        </span>
      </motion.h2>
      <div className="max-w-lg mx-auto space-y-8 px-4">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </section>
  )
}