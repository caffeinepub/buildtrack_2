import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";

const ROLE_DESCRIPTIONS: Record<
  string,
  { label: string; description: string; color: string }
> = {
  admin: {
    label: "Admin",
    description: "Full access — projects, users, BOQ, cost, reports",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  user: {
    label: "Project Manager",
    description: "Manage projects, reports, BOQ, cost tracking",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  guest: {
    label: "Viewer",
    description: "Read-only access to all data",
    color: "bg-gray-100 text-gray-600 border-gray-300",
  },
};

export default function UserManagementPage() {
  const { identity, isAdmin, userProfile, userRole, isLoading } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [targetPrincipal, setTargetPrincipal] = useState("");

  useEffect(() => {
    if (!isLoading && (!identity || !isAdmin)) {
      navigate({ to: "/" });
    }
  }, [isLoading, identity, isAdmin, navigate]);

  const assignMutation = useMutation({
    mutationFn: async ({ role }: { role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(targetPrincipal.trim());
      await actor.assignCallerUserRole(principal, role);
    },
    onSuccess: (_, { role }) => {
      toast.success(`Role assigned: ${ROLE_DESCRIPTIONS[role]?.label ?? role}`);
      setTargetPrincipal("");
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (err) => toast.error(`Failed to assign role: ${String(err)}`),
  });

  const myPrincipal = identity?.getPrincipal().toString() ?? "";
  const roleInfo = ROLE_DESCRIPTIONS[userRole];

  return (
    <div data-ocid="users.page" className="p-4 md:p-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6">
          <h1 className="font-display text-3xl font-700 mb-1">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and access across your team
          </p>
        </div>

        {/* Current user info */}
        <Card
          data-ocid="users.card"
          className="mb-6 border-2"
          style={{ borderColor: "oklch(var(--accent)/0.3)" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{
                  background: "oklch(var(--accent)/0.15)",
                  color: "oklch(var(--accent))",
                }}
              >
                {userProfile?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="font-semibold">
                  {userProfile?.name ?? "Anonymous"}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleInfo?.color ?? ""}`}
                >
                  {roleInfo?.label ?? userRole}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">
                Your Principal ID
              </p>
              <p className="font-mono text-xs break-all">{myPrincipal}</p>
            </div>
          </CardContent>
        </Card>

        {/* Role assignment */}
        <Card data-ocid="users.panel" className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assign Role to User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter a user&apos;s Principal ID and assign them a role. Users
              must first sign in with Internet Identity before you can assign
              their role.
            </p>
            <div>
              <Label
                htmlFor="target-principal"
                className="text-sm mb-1.5 block"
              >
                User Principal ID
              </Label>
              <Input
                id="target-principal"
                data-ocid="users.input"
                value={targetPrincipal}
                onChange={(e) => setTargetPrincipal(e.target.value)}
                placeholder="aaaaa-bbbbb-ccccc-ddddd-eee"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                data-ocid="users.primary_button"
                disabled={!targetPrincipal.trim() || assignMutation.isPending}
                onClick={() => assignMutation.mutate({ role: UserRole.admin })}
                className="flex-1 min-w-[120px]"
                style={{
                  background: "linear-gradient(135deg, #d97706, #f59e0b)",
                  color: "#0a1628",
                  border: "none",
                }}
              >
                {assignMutation.isPending ? "Saving..." : "Make Admin"}
              </Button>
              <Button
                data-ocid="users.secondary_button"
                variant="outline"
                disabled={!targetPrincipal.trim() || assignMutation.isPending}
                onClick={() => assignMutation.mutate({ role: UserRole.user })}
                className="flex-1 min-w-[120px]"
              >
                Make User
              </Button>
              <Button
                data-ocid="users.delete_button"
                variant="outline"
                disabled={!targetPrincipal.trim() || assignMutation.isPending}
                onClick={() => assignMutation.mutate({ role: UserRole.guest })}
                className="flex-1 min-w-[120px] text-muted-foreground"
              >
                Make Viewer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role reference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ROLE_DESCRIPTIONS).map(([key, info]) => (
                <div key={key} className="flex items-start gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 mt-0.5 ${info.color}`}
                  >
                    {info.label}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                How Internet Identity Works
              </p>
              <p className="text-xs text-muted-foreground">
                Each team member signs in on their device via Internet Identity.
                Their Principal ID uniquely identifies them. Share your app URL
                with team members — they sign in, then you assign their role
                using their Principal ID above.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
