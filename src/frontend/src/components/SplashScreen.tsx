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
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          data-ocid="splash.panel"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #0a1628 0%, #0d2149 40%, #1a3a6e 70%, #0f2d5c 100%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Subtle construction grid overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.4) 39px, rgba(255,255,255,0.4) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.4) 39px, rgba(255,255,255,0.4) 40px)",
            }}
          />

          <motion.div
            className="relative flex flex-col items-center gap-6 px-8 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            {/* Logo */}
            <motion.img
              src="/assets/uploads/11111logo-1.png"
              alt="MBCL Logo"
              className="w-64 h-auto object-contain drop-shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Gold divider */}
            <motion.div
              className="w-24 h-0.5 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #d4a843, transparent)",
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            />

            {/* Company name */}
            <h1
              className="text-2xl font-bold tracking-wide uppercase text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            >
              Mwanza Builders Company Limited
            </h1>

            {/* Tagline */}
            <p
              className="text-base italic font-medium"
              style={{ color: "#d4a843" }}
            >
              Quality Construction, Honest Service, Great Value.
            </p>

            {/* Loading dots */}
            <motion.div
              className="flex gap-1.5 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#d4a843" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
