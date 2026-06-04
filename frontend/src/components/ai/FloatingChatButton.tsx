import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function FloatingChatButton({ onClick }: { onClick: () => void }) {
  const [paginationVisible, setPaginationVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const timer = window.setTimeout(() => {
      const footers = Array.from(document.querySelectorAll('[data-pagination-footer]'));
      if (!footers.length || typeof IntersectionObserver === 'undefined') {
        setPaginationVisible(false);
        return;
      }

      const visibleFooters = new Set<Element>();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleFooters.add(entry.target);
            } else {
              visibleFooters.delete(entry.target);
            }
          });
          setPaginationVisible(visibleFooters.size > 0);
        },
        {
          root: null,
          threshold: 0.08,
          rootMargin: '0px 0px -16px 0px',
        },
      );

      footers.forEach((footer) => observer?.observe(footer));
    }, 100);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [location.pathname]);

  return (
    <motion.div
      className="group fixed right-4 z-40 sm:right-6"
      animate={{ bottom: paginationVisible ? 132 : 32 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl shadow-slate-900/20 outline-none transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:focus:ring-offset-slate-950"
        aria-label="Open AI assistant"
        title="Ask AI"
      >
        <Sparkles className="h-5 w-5" />
      </motion.button>
    </motion.div>
  );
}
