import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";

export default function SetupPage() {
  const { identity, refreshUser, isLoading } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!isLoading && !identity) {
      navigate({ to: "/login" });
    }
  }, [isLoading, identity, navigate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile({ name: fullName.trim() });
    },
    onSuccess: () => {
      refreshUser();
      toast.success("Profile saved! Welcome to MBCL BuildTrack.");
      navigate({ to: "/" });
    },
    onError: () => toast.error("Failed to save profile. Please try again."),
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        background:
          "linear-gradient(135deg, #0a1628 0%, #0f2347 40%, #1a3a6e 100%)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: "linear-gradient(90deg, #92400e, #f59e0b, #92400e)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-auto px-6"
      >
        <div className="text-center mb-8">
          <img
            src="/assets/uploads/11111logo.png"
            alt="MBCL"
            className="w-20 h-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-white text-xl font-bold">
            Complete Your Profile
          </h1>
          <p className="text-blue-200/60 text-sm mt-1">
            Enter your name to get started
          </p>
        </div>

        <div
          className="rounded-xl p-6 border border-white/10"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="full-name"
                className="text-blue-200/80 text-sm mb-1.5 block"
              >
                Full Name *
              </Label>
              <Input
                id="full-name"
                data-ocid="setup.input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Mwanza"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && fullName.trim())
                    saveMutation.mutate();
                }}
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300/80 text-xs">
                You are signed in as:{" "}
                <span className="font-mono text-amber-400">
                  {identity?.getPrincipal().toString().slice(0, 12)}...
                </span>
              </p>
            </div>

            <Button
              data-ocid="setup.submit_button"
              className="w-full h-11 font-semibold"
              style={{
                background: "linear-gradient(135deg, #d97706, #f59e0b)",
                color: "#0a1628",
                border: "none",
              }}
              onClick={() => saveMutation.mutate()}
              disabled={!fullName.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Continue to Dashboard"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
