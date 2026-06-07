import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Volume2, VolumeX, Play, Loader2 } from "lucide-react";

/**
 * MediaPlayer
 * ---------------------------------------------------------
 * A unified media renderer that handles both image and video
 * posts in an Instagram-style way:
 *
 *  - Image: plain <img> with double-tap-to-like
 *  - Video:
 *      • Autoplay, muted, loop, playsInline
 *      • IntersectionObserver pauses off-screen
 *      • Single tap to unmute
 *      • Custom progress bar at bottom
 *      • Thumbnail poster (Cloudinary) shown until first frame
 *      • Loading shimmer while buffering
 *      • Volume icon overlay when unmuted
 *      • Respects prefers-reduced-motion
 */
function MediaPlayer({
  post,
  onDoubleClick,
  floatingLikes = [],
  autoplayWhenVisible = true,
  className = "",
  showProgressBar = true,
  showMuteButton = true,
  objectFit = "cover",
  forceMuted = true, // start muted (autoplay policies)
}) {
  const mediaType = post?.mediaType || "image";
  const isVideo = mediaType === "video";
  const mediaUrl = post?.mediaUrl || post?.image || post?.imageUrl || "";
  const thumbnail = post?.thumbnail || (isVideo ? "" : mediaUrl);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [muted, setMuted] = useState(forceMuted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Honor reduced-motion preferences
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  // ---------- IntersectionObserver: autoplay when visible ----------
  useEffect(() => {
    if (!isVideo || !autoplayWhenVisible) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // Fallback: just mark as visible
      setIsVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Use >= 0.5 threshold for "in view"
          setIsVisible(entry.intersectionRatio >= 0.5);
        });
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isVideo, autoplayWhenVisible]);

  // ---------- Play/Pause based on visibility ----------
  useEffect(() => {
    if (!isVideo) return;
    const v = videoRef.current;
    if (!v) return;
    if (isVisible && !prefersReducedMotion.current) {
      const playPromise = v.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked (e.g. mobile) - just show the poster
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, [isVisible, isVideo]);

  // ---------- Mute state changes ----------
  useEffect(() => {
    if (!isVideo) return;
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted, isVideo]);

  // ---------- Time updates ----------
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    setProgress(v.currentTime / v.duration);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration)) {
      setDuration(v.duration);
    }
    setIsLoading(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // ---------- Tap to unmute (and toggle controls briefly) ----------
  const handleVideoClick = useCallback(() => {
    setMuted((m) => !m);
    setHasInteracted(true);
    setShowControls(true);
    setTimeout(() => setShowControls(false), 1500);
  }, []);

  const handleProgressClick = useCallback(
    (e) => {
      const v = videoRef.current;
      if (!v || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (e.clientX - rect.left) / rect.width),
      );
      v.currentTime = ratio * duration;
      setProgress(ratio);
    },
    [duration],
  );

  const formatTime = (sec) => {
    if (!sec || !Number.isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ---------- Image-only branch ----------
  if (!isVideo) {
    if (!mediaUrl) return null;
    return (
      <div
        ref={containerRef}
        className={`relative bg-gray-50 ${className}`}
        onDoubleClick={onDoubleClick}
      >
        <motion.img
          src={mediaUrl}
          alt="Post"
          className="w-full max-h-[520px] object-cover"
          style={{ objectFit }}
          loading="lazy"
          onDoubleClick={onDoubleClick}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        {/* "+1" floating likes (Instagram-style) */}
        {floatingLikes.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {floatingLikes.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: -120, opacity: 1, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ bottom: "40%" }}
                >
                  <Heart className="w-8 h-8 text-red-500 fill-red-500 drop-shadow-lg" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // ---------- Video branch ----------
  if (!mediaUrl) return null;

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group ${className}`}
      onDoubleClick={onDoubleClick}
    >
      {/* Poster / thumbnail (visible until first frame plays) */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectFit }}
          loading="lazy"
        />
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={mediaUrl}
        poster={thumbnail || undefined}
        className="relative w-full max-h-[520px] object-cover cursor-pointer"
        style={{ objectFit, background: "#000" }}
        autoPlay
        loop
        playsInline
        muted={muted}
        preload={isVisible ? "auto" : "none"}
        onClick={handleVideoClick}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={() => setIsLoading(false)}
      />

      {/* Top-right badge: video indicator */}
      <div className="absolute top-2 right-2 pointer-events-none">
        <div className="bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
          VIDEO
        </div>
      </div>

      {/* Mute / Unmute button (top-right under badge) */}
      {showMuteButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => !m);
            setHasInteracted(true);
          }}
          className="absolute top-2 right-2 mt-5 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          title={muted ? "Tap to unmute" : "Tap to mute"}
        >
          {muted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Center play indicator when paused (only after first interaction) */}
      {hasInteracted && !isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-7 h-7 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Custom progress bar (bottom) */}
      {showProgressBar && duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 right-0 px-2 pb-1 transition-opacity duration-200 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="h-1 w-full bg-white/30 rounded-full cursor-pointer overflow-hidden"
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-white rounded-full transition-[width] duration-150"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* "+1" floating likes (Instagram-style) */}
      {floatingLikes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingLikes.map((f) => (
              <motion.div
                key={f.id}
                initial={{ y: 0, opacity: 0, scale: 0.5 }}
                animate={{ y: -120, opacity: 1, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="absolute left-1/2 -translate-x-1/2"
                style={{ bottom: "40%" }}
              >
                <Heart className="w-8 h-8 text-red-500 fill-red-500 drop-shadow-lg" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default memo(MediaPlayer);
