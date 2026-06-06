import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Sparkles, ChevronDown, X } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Float, TorusKnot, Sphere, MeshDistortMaterial } from "@react-three/drei";
import ParticlesBackground from "../../components/landing/ParticlesBackground";
import MagneticButton from "../../components/landing/MagneticButton";

const headlineWords = ["Connect", "Beyond", "Likes"];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.4 },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

function FloatingShapes() {
  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
        <TorusKnot args={[1.2, 0.3, 32, 8]} position={[-5, 2, -8]} scale={0.8}>
          <MeshDistortMaterial color="#6D5040" transparent opacity={0.3} />
        </TorusKnot>
      </Float>
      <Float speed={2} rotationIntensity={0.8} floatIntensity={2}>
        <Sphere args={[0.8, 16, 16]} position={[6, -1, -10]}>
          <MeshDistortMaterial color="#927C6E" transparent opacity={0.2} distort={0.4} />
        </Sphere>
      </Float>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={1}>
        <TorusKnot args={[0.9, 0.25, 32, 6]} position={[4, 3, -12]} scale={0.6}>
          <MeshDistortMaterial color="#D5D0CA" transparent opacity={0.15} />
        </TorusKnot>
      </Float>
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.8}>
        <Sphere args={[0.5, 8, 8]} position={[-4, -2, -6]}>
          <MeshDistortMaterial color="#6D5040" transparent opacity={0.25} distort={0.6} />
        </Sphere>
      </Float>
    </group>
  );
}

function SplitText({ text, className = "" }) {
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 30, rotateX: -40 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.6 + i * 0.03,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function HeroSection() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const [showDemo, setShowDemo] = useState(false);

  const updateParallax = useCallback(() => {
    if (!contentRef.current) return;
    contentRef.current.style.transform = `translate3d(${mouseRef.current.x * 0.5}px, ${mouseRef.current.y * 0.5}px, 0)`;
    rafRef.current = null;
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
      };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateParallax);
      }
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateParallax]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-black"
    >
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Canvas
            camera={{ position: [0, 0, 20], fov: 60 }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, alpha: true }}
          >
            <ParticlesBackground />
            <FloatingShapes />
          </Canvas>
        </Suspense>
      </div>

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-sm px-4 py-1.5 rounded-full mb-8 border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-white/80" />
            <span>The creator platform for everyone</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            <motion.span className="inline-flex flex-wrap justify-center gap-x-4">
              {headlineWords.map((word) => (
                <motion.span
                  key={word}
                  variants={wordVariants}
                  className="bg-gradient-to-r from-white via-white to-warm-200 bg-clip-text text-transparent"
                >
                  {word}
                </motion.span>
              ))}
            </motion.span>
          </h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            <SplitText text="A new generation social platform built for creators, communities, and meaningful interactions." />
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <MagneticButton variant="primary" href="/register">
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </MagneticButton>
            <MagneticButton
              variant="secondary"
              className="!px-10 !py-4"
              onClick={() => setShowDemo(true)}
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-warm-950 border border-warm-800/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDemo(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-warm-200/70 hover:text-white hover:bg-black/70 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black via-warm-950 to-black">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-warm-500/20 flex items-center justify-center animate-pulse-soft">
                    <Play className="w-10 h-10 text-warm-400 ml-1" />
                  </div>
                  <p className="text-warm-300 text-lg">Demo video coming soon</p>
                  <p className="text-warm-500 text-sm mt-2">Experience VibeSnaps in action</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-warm-400/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}