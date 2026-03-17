import { motion } from 'framer-motion'

const Shimmer = ({ className }) => (
  <div className={`shimmer rounded ${className}`} />
)

export default function LoadingSkeleton({ type = 'chart' }) {
  if (type === 'chart') return (
    <div className="w-full h-full flex flex-col gap-3 p-4">
      <div className="flex gap-2">
        {[60, 45, 70, 55, 80].map((w, i) => (
          <Shimmer key={i} className="h-4" style={{ width: w }} />
        ))}
      </div>
      <Shimmer className="flex-1 w-full rounded-xl" style={{ minHeight: 300 }} />
      <Shimmer className="h-16 w-full rounded-xl" />
      <Shimmer className="h-12 w-full rounded-xl" />
    </div>
  )

  if (type === 'metrics') return (
    <div className="space-y-3">
      <Shimmer className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  )

  if (type === 'financial') return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Shimmer key={i} className="h-10 w-full rounded-xl" />
      ))}
    </div>
  )

  if (type === 'header') return (
    <div className="flex items-center gap-3">
      <Shimmer className="h-8 w-32 rounded-lg" />
      <Shimmer className="h-6 w-24 rounded-lg" />
      <Shimmer className="h-6 w-16 rounded-lg" />
    </div>
  )

  return <Shimmer className={`w-full h-8 rounded-lg`} />
}
