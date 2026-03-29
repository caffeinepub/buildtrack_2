import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";

export default function PendingApprovalPage() {
  const { identity, logout } = useAuth();
  const { actor } = useActor();
  const [requested, setRequested] = useState(false);

  const principalId = identity?.getPrincipal().toString() ?? "";

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.requestApproval();
    },
    onSuccess: () => {
      setRequested(true);
      toast.success(
        "Approval request sent! Please wait for an admin to review.",
      );
    },
    onError: (err) => toast.error(`Failed to send request: ${String(err)}`),
  });

  return (
    <div
      data-ocid="pending_approval.page"
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "oklch(var(--sidebar))" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 shadow-2xl border text-center"
          style={{
            background: "oklch(var(--card))",
            borderColor: "oklch(var(--border))",
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/assets/uploads/11111logo-019d3aee-b013-75c5-ac84-61964c899068-1.png"
              alt="MBCL Logo"
              className="w-24 h-auto object-contain"
            />
          </div>

          {/* Heading */}
          <h1
            className="font-display text-xl font-bold mb-1"
            style={{ color: "oklch(var(--sidebar-foreground))" }}
          >
            Mwanza Builders Company Limited
          </h1>
          <p
            className="text-sm italic mb-6"
            style={{ color: "oklch(var(--accent))" }}
          >
            Quality Construction, Honest Service, Great Value.
          </p>

          {/* Status icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
            style={{ background: "oklch(var(--accent)/0.15)" }}
          >
            ⏳
          </div>

          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "oklch(var(--sidebar-foreground))" }}
          >
            Account Pending Approval
          </h2>
          <p
            className="text-sm mb-6 leading-relaxed"
            style={{ color: "oklch(var(--sidebar-foreground)/0.7)" }}
          >
            Your account is pending admin approval. Once approved, you'll have
            full access to create and edit projects.
          </p>

          {/* Principal ID */}
          <div
            className="rounded-lg p-3 mb-6 text-left"
            style={{ background: "oklch(var(--muted)/0.3)" }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: "oklch(var(--sidebar-foreground)/0.5)" }}
            >
              Your Principal ID
            </p>
            <p
              className="font-mono text-xs break-all"
              style={{ color: "oklch(var(--sidebar-foreground)/0.8)" }}
            >
              {principalId}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!requested ? (
              <Button
                data-ocid="pending_approval.primary_button"
                className="w-full font-semibold"
                style={{
                  background: "linear-gradient(135deg, #d97706, #f59e0b)",
                  color: "#0a1628",
                  border: "none",
                }}
                disabled={requestMutation.isPending}
                onClick={() => requestMutation.mutate()}
              >
                {requestMutation.isPending ? "Sending..." : "Request Approval"}
              </Button>
            ) : (
              <div
                data-ocid="pending_approval.success_state"
                className="rounded-lg p-3 text-sm font-medium"
                style={{
                  background: "oklch(var(--accent)/0.15)",
                  color: "oklch(var(--accent))",
                }}
              >
                ✅ Approval request sent. An admin will review shortly.
              </div>
            )}
            <Button
              data-ocid="pending_approval.secondary_button"
              variant="ghost"
              className="w-full"
              style={{ color: "oklch(var(--sidebar-foreground)/0.6)" }}
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
