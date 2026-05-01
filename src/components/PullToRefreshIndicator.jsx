import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Visual indicator shown at the top of the page while pulling to refresh.
 */
export default function PullToRefreshIndicator({ pullDistance, isRefreshing }) {
  const threshold = 72;
  const progress = Math.min(pullDistance / threshold, 1);
  const visible = pullDistance > 8 || isRefreshing;

  if (!visible) return null;

  return (
    <motion.div
      className="fixed top-14 left-1/2 z-40 -translate-x-1/2 flex items-center justify-center"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-card border border-border rounded-full p-2 shadow-md">
        {isRefreshing ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <motion.div
            style={{ rotate: progress * 180 }}
            className="w-4 h-4 text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M4 4v6h6M20 20v-6h-6" />
              <path d="M20 10A8 8 0 0 0 6.34 6.34L4 10m16 4a8 8 0 0 1-13.66 3.66L4 14" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}