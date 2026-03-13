import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          data-ocid="splash.panel"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Logo */}
            <img
              src="/assets/uploads/11111logo-1.png"
              alt="MBCL Logo"
              className="w-72 h-auto object-contain"
            />

            {/* Company name */}
            <h1 className="text-2xl font-bold text-blue-900 text-center tracking-wide uppercase">
              Mwanza Builders Company Limited
            </h1>

            {/* Tagline */}
            <p className="text-base text-yellow-500 italic text-center font-medium">
              Quality Construction, Honest service, Great Value.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
