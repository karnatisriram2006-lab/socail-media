import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Download, Smartphone, Apple } from "lucide-react";

const feedMockItems = [
  { color: "from-warm-500 to-warm-400", h: "h-16" },
  { color: "from-warm-400 to-warm-300", h: "h-12" },
  { color: "from-warm-300 to-warm-200", h: "h-14" },
  { color: "from-warm-500 to-warm-400", h: "h-10" },
];

function PhoneMockup({ index = 0, offset = { x: 0, y: 0 } }) {
  const phoneRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = phoneRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    }
  };

  return (
    <motion.div
      ref={phoneRef}
      className="relative"
      style={{
        translateX: offset.x,
        translateY: offset.y,
        rotateY: mousePos.x * 10,
        rotateX: -mousePos.y * 10,
        perspective: 1000,
      }}
      animate={{ y: [0, -12, 0] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.5,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
    >
      <div
        className={`w-72 h-[500px] bg-warm-950 rounded-3xl border-4 border-warm-800 overflow-hidden shadow-2xl shadow-warm-500/20 relative ${index > 0 ? "hidden lg:block" : ""}`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-warm-900 rounded-b-xl z-10" />
        <div className="p-6 pt-10 h-full flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-warm-500 to-warm-400" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-24 bg-white/10 rounded-full" />
              <div className="h-2 w-16 bg-white/5 rounded-full" />
            </div>
          </div>
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-warm-500/20 to-warm-400/20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-2">
                <Smartphone className="w-6 h-6 text-white/60" />
              </div>
              <p className="text-white/40 text-xs">Your Feed</p>
            </div>
          </div>
          {feedMockItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${item.color}`} />
              <div className={`flex-1 ${item.h} rounded-xl bg-white/5`} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function AppSection() {
  const { scrollYProgress } = useScroll();
  const phoneY = useTransform(scrollYProgress, [0.6, 0.9], [60, -60]);

  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-warm-950 via-black to-warm-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-warm-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-warm-400/10 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Take VibeSnaps{" "}
              <span className="bg-gradient-to-r from-warm-300 to-warm-200 bg-clip-text text-transparent">
                Anywhere
              </span>
            </h2>
            <p className="text-warm-300 text-lg mb-8 max-w-md mx-auto lg:mx-0">
              Download our mobile app and never miss a moment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                className="bg-warm-200 text-warm-950 px-6 py-4 rounded-2xl flex items-center gap-3 font-semibold hover:bg-white transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Apple className="w-6 h-6" />
                App Store
              </motion.button>
              <motion.button
                className="bg-warm-200 text-warm-950 px-6 py-4 rounded-2xl flex items-center gap-3 font-semibold hover:bg-white transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Download className="w-6 h-6" />
                Google Play
              </motion.button>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-warm-500 justify-center lg:justify-start">
              <Smartphone className="w-4 h-4" />
              Available on iOS and Android
            </div>
          </motion.div>

          <motion.div
            className="flex-1 flex items-center justify-center gap-4"
            style={{ y: phoneY }}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PhoneMockup index={0} />
            <PhoneMockup index={1} offset={{ x: -40, y: 30 }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}