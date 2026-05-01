import { useEffect, useRef, useState } from "react";

/**
 * usePullToRefresh
 * Fires `onRefresh` when user pulls down more than `threshold` px on a touch screen.
 * Returns `{ isRefreshing, pullDistance }` for optional UI feedback.
 */
export function usePullToRefresh(onRefresh, { threshold = 72, scrollContainerRef } = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(null);
  const pulling = useRef(false);

  useEffect(() => {
    const getEl = () => scrollContainerRef?.current || window;

    const onTouchStart = (e) => {
      const scrollTop = scrollContainerRef?.current
        ? scrollContainerRef.current.scrollTop
        : window.scrollY;
      if (scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta, threshold * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);
        await onRefresh();
        setIsRefreshing(false);
      } else {
        setPullDistance(0);
      }
      startY.current = null;
      pulling.current = false;
    };

    const el = getEl();
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance, isRefreshing, scrollContainerRef]);

  return { isRefreshing, pullDistance };
}