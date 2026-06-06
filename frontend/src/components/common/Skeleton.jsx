import { motion } from 'framer-motion'

export default function Skeleton({ className = '', variant = 'rect', width, height }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      className={`bg-gray-200 ${
        variant === 'circular' ? 'rounded-full' : 'rounded-lg'
      } ${className}`}
      style={{ width, height }}
    />
  )
}

export function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton width={120} height={12} />
          <Skeleton width={80} height={10} />
        </div>
      </div>
      <Skeleton width="100%" height={300} />
      <Skeleton width="60%" height={12} />
      <Skeleton width="40%" height={12} />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2 flex-1">
          <Skeleton width={150} height={16} />
          <Skeleton width={200} height={12} />
        </div>
      </div>
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
      <div className="flex gap-8">
        <Skeleton width={60} height={12} />
        <Skeleton width={60} height={12} />
        <Skeleton width={60} height={12} />
      </div>
    </div>
  )
}
