import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Creators", href: "#creators" },
  { label: "Community", href: "#community" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-gradient-to-r from-warm-500 via-warm-400 to-warm-300 origin-left"
        style={{ scaleX }}
      />
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/70 backdrop-blur-xl border-b border-warm-800/30"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <Sparkles className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
            <span className="text-lg md:text-xl font-bold tracking-tight text-white">
              VibeSnaps
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-warm-300/70">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative hover:text-white transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-warm-400 after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-warm-300/70 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-warm-500 text-white px-5 py-2.5 rounded-full shadow-lg shadow-warm-500/20 hover:bg-warm-400 hover:shadow-warm-400/40 transition-all duration-300"
            >
              Sign Up Free
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-warm-300/80 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-black/80 backdrop-blur-2xl border-t border-warm-800/30"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((item, i) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setMobileOpen(false)}
                    className="block text-lg font-medium text-warm-300/70 hover:text-warm-400 transition-colors"
                  >
                    {item.label}
                  </motion.a>
                ))}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 flex flex-col gap-3"
                >
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-medium text-warm-300/70 hover:text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-semibold bg-warm-500 text-white px-5 py-3 rounded-full shadow-lg"
                  >
                    Sign Up Free
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}