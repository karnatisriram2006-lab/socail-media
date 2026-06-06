import { motion } from "framer-motion";
import useTilt from "../../hooks/useTilt";

const creators = [
  { name: "Luna Martinez", handle: "@luna_art", avatar: "https://i.pravatar.cc/150?u=luna", role: "Digital Artist", followers: "245K", bio: "Painting dreams with pixels. NFT artist & illustrator." },
  { name: "Marcus Chen", handle: "@marcus_foto", avatar: "https://i.pravatar.cc/150?u=marcus", role: "Photographer", followers: "189K", bio: "Capturing the world one frame at a time. Sony ambassador." },
  { name: "Aria Patel", handle: "@aria_writes", avatar: "https://i.pravatar.cc/150?u=aria", role: "Content Writer", followers: "312K", bio: "Words that move. Storyteller & poet." },
  { name: "Jake Thompson", handle: "@jake_films", avatar: "https://i.pravatar.cc/150?u=jake", role: "Filmmaker", followers: "178K", bio: "Short films & visual stories. Award-winning director." },
  { name: "Sophie Kim", handle: "@sophie_designs", avatar: "https://i.pravatar.cc/150?u=sophie", role: "UI Designer", followers: "156K", bio: "Crafting beautiful interfaces. Design system enthusiast." },
  { name: "Diego Santos", handle: "@diego_music", avatar: "https://i.pravatar.cc/150?u=diego", role: "Musician", followers: "423K", bio: "Making melodies that matter. Producer & songwriter." },
  { name: "Emma Wilson", handle: "@emma_fit", avatar: "https://i.pravatar.cc/150?u=emma", role: "Fitness Coach", followers: "567K", bio: "Strong body, strong mind. Certified personal trainer." },
  { name: "Oliver Brown", handle: "@oliver_codes", avatar: "https://i.pravatar.cc/150?u=oliver", role: "Developer", followers: "134K", bio: "Building the future, one line at a time. Full-stack creator." },
  { name: "Zoe Taylor", handle: "@zoe_cooks", avatar: "https://i.pravatar.cc/150?u=zoe", role: "Chef", followers: "298K", bio: "Plant-based recipes that taste amazing. Cookbook author." },
  { name: "Ryan Garcia", handle: "@ryan_travels", avatar: "https://i.pravatar.cc/150?u=ryan", role: "Travel Blogger", followers: "445K", bio: "Exploring every corner of the globe. Adventure awaits." },
];

function CreatorCard({ creator }) {
  const tilt = useTilt();

  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.handleMouse}
      onMouseEnter={tilt.handleEnter}
      onMouseLeave={tilt.handleLeave}
      className="w-72 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex-shrink-0 cursor-default group"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative mb-4 inline-block">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-warm-500/50 transition-all duration-300"
        />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-warm-500 rounded-full border-2 border-black" />
      </div>
      <h3 className="font-semibold text-white group-hover:text-warm-400 transition-colors duration-300">
        {creator.name}
      </h3>
      <p className="text-sm text-warm-400 mb-1">{creator.handle}</p>
      <p className="text-warm-300 text-sm mb-2">{creator.role}</p>
      <p className="text-xs text-warm-500 mb-3">
        {creator.followers} followers
      </p>
      <p className="text-sm text-warm-300 leading-relaxed">{creator.bio}</p>
      <motion.div className="h-0.5 w-0 bg-gradient-to-r from-warm-500 to-warm-300 rounded-full mt-4 group-hover:w-full transition-all duration-500" />
    </motion.div>
  );
}

function ScrollingRow({ creators, direction }) {
  const duplicated = [...creators, ...creators];

  return (
    <div className="relative flex overflow-hidden">
      <motion.div
        className="flex gap-6"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          x: { repeat: Infinity, repeatType: "loop", duration: 80, ease: "linear" },
        }}
      >
        {duplicated.map((creator, i) => (
          <CreatorCard key={`${creator.handle}-${i}`} creator={creator} />
        ))}
      </motion.div>
    </div>
  );
}

export default function CreatorsSection() {
  return (
    <section className="py-32 overflow-hidden relative bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-warm-950/10 to-black pointer-events-none" />
      <div className="relative z-10 mb-16">
        <motion.h2
          className="text-4xl md:text-6xl font-bold text-center mb-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Meet Our{" "}
          <span className="bg-gradient-to-r from-warm-400 to-warm-200 bg-clip-text text-transparent">
            Creators
          </span>
        </motion.h2>
        <motion.p
          className="text-warm-300 text-center text-lg max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Thousands of creators call VibeSnaps home
        </motion.p>
      </div>
      <div className="space-y-8">
        <ScrollingRow creators={creators} direction="left" />
        <ScrollingRow creators={creators} direction="right" />
      </div>
    </section>
  );
}