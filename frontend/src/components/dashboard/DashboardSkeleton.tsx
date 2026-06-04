import { motion } from 'framer-motion';

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              className="h-28 rounded-2xl bg-gray-200 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              className="h-48 rounded-2xl bg-gray-200 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <motion.div
              key={index}
              className="h-56 rounded-2xl bg-gray-200 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
