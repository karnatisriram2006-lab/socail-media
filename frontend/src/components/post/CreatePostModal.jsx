import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, X, Smile, MapPin, Sparkles, Video, Image as ImageIcon, Play } from "lucide-react";
import { usePostStore } from "../../store/postStore";
import { useToast } from "../ui/Toast";

const MAX_VIDEO_SECONDS = 60;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function formatDuration(sec) {
  if (!sec || !Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CreatePostModal({ onClose, defaultMediaKind = "image" }) {
  const { createPost } = usePostStore();
  const toast = useToast();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaKind, setMediaKind] = useState(defaultMediaKind); // "image" | "video"
  const [videoDuration, setVideoDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const probeVideoRef = useRef(null);

  // Clean up the object URL on unmount / when a new file is selected
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Probe the duration of a video file by loading it into a hidden <video>.
  const probeVideoDuration = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;
      v.onloadedmetadata = () => {
        const d = v.duration;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      v.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read video metadata"));
      };
    });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setError("Unsupported file type. Please upload an image or video.");
      return;
    }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      setError("Image size must be less than 5MB");
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setError("Video size must be less than 100MB");
      return;
    }

    if (isVideo) {
      try {
        const dur = await probeVideoDuration(file);
        if (dur > MAX_VIDEO_SECONDS) {
          setError(
            `Video is ${formatDuration(dur)} long. Maximum is ${MAX_VIDEO_SECONDS} seconds.`,
          );
          return;
        }
        setVideoDuration(dur);
      } catch {
        setError("Could not read video duration. Please try another file.");
        return;
      }
    } else {
      setVideoDuration(0);
    }

    // Revoke old preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMediaKind(isVideo ? "video" : "image");
    setError(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Reuse the change handler by creating a synthetic event-like call
    const fakeEvent = { target: { files: [file] } };
    await handleFileChange(fakeEvent);
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoDuration(0);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a photo or video to share");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createPost(caption, selectedFile, {
        mediaKind,
        videoDuration: mediaKind === "video" ? videoDuration : undefined,
      });
      toast.success("Post created successfully!");
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Create new post</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 text-red-600 text-sm p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-center gap-3 mb-3">
                <ImageIcon className="w-10 h-10 text-blue-500" />
                <Video className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Photos: JPEG, PNG, WEBP (Max 5MB)
                <br />
                Videos: MP4, WebM, MOV (Max 100MB, up to {MAX_VIDEO_SECONDS}s)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              {mediaKind === "image" ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-96 object-contain bg-gray-100"
                />
              ) : (
                <div className="relative">
                  <video
                    ref={probeVideoRef}
                    src={previewUrl}
                    className="w-full max-h-96 object-contain bg-black"
                    controls
                    playsInline
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[11px] font-semibold px-2 py-1 rounded flex items-center gap-1">
                    <Play className="w-3 h-3 fill-white" />
                    {formatDuration(videoDuration)}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full p-3 bg-gray-50 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-gray-400">
              <Smile className="w-5 h-5 cursor-pointer hover:text-blue-500" />
              <MapPin className="w-5 h-5 cursor-pointer hover:text-blue-500" />
              <Sparkles className="w-5 h-5 cursor-pointer hover:text-blue-500" />
            </div>
            <motion.button
              type="submit"
              disabled={loading || !selectedFile}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Publishing..." : "Share Post"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
