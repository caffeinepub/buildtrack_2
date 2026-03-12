import { HardHat } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(false);
    }, 2200);
    return () => clearTimeout(showTimer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          data-ocid="splash.panel"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "oklch(0.14 0.025 260)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          {/* Background grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.9 0.01 80) 1px, transparent 1px), linear-gradient(90deg, oklch(0.9 0.01 80) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Radial glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.55 0.16 45 / 0.5), transparent 70%)",
            }}
          />

          {/* Content */}
          <motion.div
            className="relative flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1,
            }}
          >
            {/* Logo */}
            <div className="relative">
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center"
                style={{
                  background: "oklch(0.2 0.03 260)",
                  boxShadow:
                    "0 0 0 1px oklch(0.3 0.04 260), 0 20px 60px oklch(0.55 0.16 45 / 0.25)",
                }}
              >
                <img
                  src="/assets/generated/buildtrack-logo-transparent.dim_200x200.png"
                  alt="BuildTrack Logo"
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    // Fallback to icon if image fails
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <HardHat
                  className="w-14 h-14 absolute hidden"
                  style={{ color: "oklch(0.65 0.18 45)" }}
                />
              </div>
              {/* Amber accent ring */}
              <div
                className="absolute -inset-1 rounded-3xl opacity-30"
                style={{
                  background: "transparent",
                  boxShadow: "0 0 0 1.5px oklch(0.65 0.18 45)",
                }}
              />
            </div>

            {/* Company name */}
            <div className="text-center">
              <h1
                className="text-5xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  color: "oklch(0.96 0.005 80)",
                  letterSpacing: "-0.03em",
                }}
              >
                Build
                <span style={{ color: "oklch(0.7 0.18 45)" }}>Track</span>
              </h1>
              <p
                className="mt-2 text-base tracking-widest uppercase"
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  color: "oklch(0.6 0.02 260)",
                  letterSpacing: "0.2em",
                  fontSize: "0.72rem",
                }}
              >
                Construction Project Management
              </p>
            </div>

            {/* Loading bar */}
            <div
              className="w-40 h-0.5 rounded-full overflow-hidden"
              style={{ background: "oklch(0.25 0.02 260)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "oklch(0.65 0.18 45)" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.0, ease: "easeInOut", delay: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
