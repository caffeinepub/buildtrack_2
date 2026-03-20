import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { identity, userProfile, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (!isLoading && identity) {
      if (!userProfile) {
        navigate({ to: "/setup" });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [isLoading, identity, userProfile, navigate]);

  return (
    <div
      data-ocid="login.page"
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a1628 0%, #0f2347 40%, #1a3a6e 100%)",
      }}
    >
      {/* Construction grid texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(245,158,11,0.4) 40px, rgba(245,158,11,0.4) 41px),
                            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(245,158,11,0.4) 40px, rgba(245,158,11,0.4) 41px)`,
        }}
      />

      {/* Gold accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm mx-auto px-6"
      >
        {/* Logo & branding */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex justify-center mb-5"
          >
            <img
              src="/assets/uploads/11111logo.png"
              alt="MBCL Logo"
              className="w-28 h-auto object-contain drop-shadow-lg"
            />
          </motion.div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider leading-tight mb-1">
            Mwanza Builders Company Limited
          </h1>
          <p className="text-amber-400 text-sm italic mb-2">
            Quality Construction, Honest Service, Great Value.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-4" />
          <p className="text-blue-200/70 text-xs uppercase tracking-widest">
            Construction Management System
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-xl p-6 shadow-2xl border border-white/10"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 className="text-white text-lg font-semibold mb-1">
            Welcome back
          </h2>
          <p className="text-blue-200/60 text-sm mb-6">
            Sign in to access your construction projects
          </p>

          <Button
            data-ocid="login.primary_button"
            className="w-full h-12 text-base font-semibold mb-4"
            style={{
              background: "linear-gradient(135deg, #d97706, #f59e0b)",
              color: "#0a1628",
              border: "none",
            }}
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-lg">🔑</span>
                Sign In with Internet Identity
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2 mb-5">
            <Checkbox
              id="remember"
              data-ocid="login.checkbox"
              checked={remember}
              onCheckedChange={(v) => setRemember(!!v)}
              className="border-white/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            <Label
              htmlFor="remember"
              className="text-blue-200/70 text-sm cursor-pointer"
            >
              Remember me on this device
            </Label>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-blue-200/50 text-xs text-center leading-relaxed">
              Internet Identity is a secure, password-free authentication
              system. Your identity is linked to your device — no username or
              password needed.
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200/30 text-xs mt-6">
          © {new Date().getFullYear()} MBCL. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
