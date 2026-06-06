import { motion } from "framer-motion";
import {
  Zap,
  Palette,
  Camera,
  Users,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import useTilt from "../../hooks/useTilt";

const features = [
  {
    icon: Zap,
    title: "Real-time Interactions",
    description:
      "Watch likes, comments, and shares flow in as they happen. No refresh needed — instant engagement at your fingertips.",
    gradient: "from-warm-500/20 to-warm-400/20",
    iconColor: "text-warm-400",
  },
  {
    icon: Palette,
    title: "Beautiful Profiles",
    description:
      "Customize your space with themes, layouts, and colors. Your profile is your canvas — make it unforgettable.",
    gradient: "from-warm-500/20 to-warm-300/20",
    iconColor: "text-warm-300",
  },
  {
    icon: Camera,
    title: "Creator Tools",
    description:
      "Edit, filter, and enhance your content with pro-grade tools built right into the platform. No third-party apps needed.",
    gradient: "from-warm-400/20 to-warm-200/20",
    iconColor: "text-warm-200",
  },
  {
    icon: Users,
    title: "Communities",
    description:
      "Find your tribe in thousands of niche communities. Share, learn, and grow alongside people who get you.",
    gradient: "from-warm-500/20 to-warm-400/20",
    iconColor: "text-warm-400",
  },
  {
    icon: MessageCircle,
    title: "Private Messaging",
    description:
      "Connect one-on-one with end-to-end encryption. Share moments, collaborate, and build real relationships.",
    gradient: "from-warm-400/20 to-warm-300/20",
    iconColor: "text-warm-300",
  },
  {
    icon: Sparkles,
    title: "AI Recommendations",
    description:
      "Discover content tailored to your taste. Our AI learns what you love and serves you more of it, perfectly curated.",
    gradient: "from-warm-500/20 to-warm-200/20",
    iconColor: "text-warm-200",
  },
];

const floatingOrbs = [
  { size: 600, x: "10%", y: "20%", color: "bg-warm-500/10", delay: 0, duration: 8 },
  { size: 400, x: "70%", y: "10%", color: "bg-warm-400/10", delay: 2, duration: 10 },
  { size: 500, x: "40%", y: "60%", color: "bg-warm-300/8", delay: 4, duration: 12 },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function FeatureCard({ feature }) {
  const tilt = useTilt();

  return (
    <motion.div variants={cardVariants}>
      <motion.div
        ref={tilt.ref}
        onMouseMove={tilt.handleMouse}
        onMouseEnter={tilt.handleEnter}
        onMouseLeave={tilt.handleLeave}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group cursor-default transition-colors duration-500 h-full"
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient}`}
        />
        <div className="relative z-10 flex flex-col h-full">
          <div className="w-14 h-14 rounded-2xl bg-warm-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
          </div>
          <h3 className="text-xl font-semibold text-white mt-5 mb-3">
            {feature.title}
          </h3>
          <p className="text-warm-300 leading-relaxed flex-1">
            {feature.description}
          </p>
          <motion.div className="h-0.5 w-0 bg-gradient-to-r from-warm-500 to-warm-300 rounded-full group-hover:w-full transition-all duration-500 mt-auto" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="relative py-32 overflow-hidden bg-black">
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${orb.color} pointer-events-none`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            filter: "blur(80px)",
          }}
          animate={{
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.h2
          className="text-4xl md:text-6xl font-bold text-center mb-16 text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Everything You
          <span className="bg-gradient-to-r from-warm-400 via-warm-300 to-warm-200 bg-clip-text text-transparent">
            {" "}
            Need
          </span>
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
