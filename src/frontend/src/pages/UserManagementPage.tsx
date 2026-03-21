import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApprovalStatus, UserRole } from "../backend";
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

function truncatePrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 8)}...${p.slice(-4)}`;
}

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

  // Approvals query
  const { data: approvals, isLoading: approvalsLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && isAdmin,
    refetchInterval: 30_000,
  });

  // Active users query
  const { data: activeUsers, isLoading: activeLoading } = useQuery({
    queryKey: ["active-users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveUsers();
    },
    enabled: !!actor && isAdmin,
    refetchInterval: 30_000,
  });

  const pendingApprovals = (approvals ?? []).filter(
    (a) => a.status === ApprovalStatus.pending,
  );

  const setApprovalMutation = useMutation({
    mutationFn: async ({
      principal,
      status,
    }: {
      principal: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.setApproval(principal, status);
    },
    onSuccess: (_, { status }) => {
      const label =
        status === ApprovalStatus.approved
          ? "approved"
          : status === ApprovalStatus.rejected
            ? "rejected"
            : "updated";
      toast.success(`User ${label} successfully`);
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["active-users"] });
    },
    onError: (err) => toast.error(`Failed: ${String(err)}`),
  });

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
    <div data-ocid="users.page" className="p-4 md:p-8 max-w-4xl">
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
            Manage user access, approvals, and roles across your team
          </p>
        </div>

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList
            className="grid w-full grid-cols-4"
            style={{ background: "oklch(var(--sidebar)/0.15)" }}
          >
            <TabsTrigger
              data-ocid="users.approval_queue.tab"
              value="queue"
              className="relative"
            >
              Approval Queue
              {pendingApprovals.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger data-ocid="users.all_users.tab" value="all">
              All Users
            </TabsTrigger>
            <TabsTrigger data-ocid="users.active_users.tab" value="active">
              Active
              {(activeUsers ?? []).length > 0 && (
                <span className="ml-1.5 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {(activeUsers ?? []).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger data-ocid="users.roles.tab" value="roles">
              Roles
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Approval Queue ── */}
          <TabsContent value="queue">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div
                    data-ocid="users.queue.empty_state"
                    className="py-10 text-center text-muted-foreground text-sm"
                  >
                    <div className="text-3xl mb-2">✅</div>
                    No pending approvals
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map((a, idx) => {
                      const pStr = a.principal.toString();
                      return (
                        <div
                          key={pStr}
                          data-ocid={`users.queue.item.${idx + 1}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                          style={{ borderColor: "oklch(var(--border))" }}
                        >
                          <div className="min-w-0">
                            <p className="font-mono text-sm truncate">
                              {truncatePrincipal(pStr)}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-0.5 bg-amber-50 text-amber-700 border-amber-300"
                            >
                              Pending
                            </Badge>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              data-ocid={`users.queue.approve.button.${idx + 1}`}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={setApprovalMutation.isPending}
                              onClick={() =>
                                setApprovalMutation.mutate({
                                  principal: a.principal,
                                  status: ApprovalStatus.approved,
                                })
                              }
                            >
                              ✅ Approve
                            </Button>
                            <Button
                              data-ocid={`users.queue.reject.button.${idx + 1}`}
                              size="sm"
                              variant="destructive"
                              disabled={setApprovalMutation.isPending}
                              onClick={() =>
                                setApprovalMutation.mutate({
                                  principal: a.principal,
                                  status: ApprovalStatus.rejected,
                                })
                              }
                            >
                              ❌ Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: All Users ── */}
          <TabsContent value="all">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Users</CardTitle>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (approvals ?? []).length === 0 ? (
                  <div
                    data-ocid="users.all.empty_state"
                    className="py-10 text-center text-muted-foreground text-sm"
                  >
                    No users registered yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(approvals ?? []).map((a, idx) => {
                      const pStr = a.principal.toString();
                      const isApproved = a.status === ApprovalStatus.approved;
                      const isPending = a.status === ApprovalStatus.pending;
                      const isRejected = a.status === ApprovalStatus.rejected;
                      return (
                        <div
                          key={pStr}
                          data-ocid={`users.all.item.${idx + 1}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                          style={{ borderColor: "oklch(var(--border))" }}
                        >
                          <div className="min-w-0">
                            <p className="font-mono text-sm truncate">
                              {truncatePrincipal(pStr)}
                            </p>
                            {isApproved && (
                              <Badge
                                className="text-[10px] mt-0.5 bg-green-100 text-green-800 border-green-300"
                                variant="outline"
                              >
                                Approved
                              </Badge>
                            )}
                            {isPending && (
                              <Badge
                                className="text-[10px] mt-0.5 bg-amber-50 text-amber-700 border-amber-300"
                                variant="outline"
                              >
                                Pending
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge
                                className="text-[10px] mt-0.5 bg-red-50 text-red-700 border-red-300"
                                variant="outline"
                              >
                                Rejected
                              </Badge>
                            )}
                          </div>
                          <div className="shrink-0">
                            {isApproved && (
                              <Button
                                data-ocid={`users.all.deactivate.button.${idx + 1}`}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={setApprovalMutation.isPending}
                                onClick={() =>
                                  setApprovalMutation.mutate({
                                    principal: a.principal,
                                    status: ApprovalStatus.rejected,
                                  })
                                }
                              >
                                🚫 Deactivate
                              </Button>
                            )}
                            {isRejected && (
                              <Button
                                data-ocid={`users.all.reapprove.button.${idx + 1}`}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={setApprovalMutation.isPending}
                                onClick={() =>
                                  setApprovalMutation.mutate({
                                    principal: a.principal,
                                    status: ApprovalStatus.approved,
                                  })
                                }
                              >
                                ✅ Re-approve
                              </Button>
                            )}
                            {isPending && (
                              <div className="flex gap-2">
                                <Button
                                  data-ocid={`users.all.approve.button.${idx + 1}`}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={setApprovalMutation.isPending}
                                  onClick={() =>
                                    setApprovalMutation.mutate({
                                      principal: a.principal,
                                      status: ApprovalStatus.approved,
                                    })
                                  }
                                >
                                  ✅
                                </Button>
                                <Button
                                  data-ocid={`users.all.reject.button.${idx + 1}`}
                                  size="sm"
                                  variant="destructive"
                                  disabled={setApprovalMutation.isPending}
                                  onClick={() =>
                                    setApprovalMutation.mutate({
                                      principal: a.principal,
                                      status: ApprovalStatus.rejected,
                                    })
                                  }
                                >
                                  ❌
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: Active Users ── */}
          <TabsContent value="active">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Currently Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (activeUsers ?? []).length === 0 ? (
                  <div
                    data-ocid="users.active.empty_state"
                    className="py-10 text-center text-muted-foreground text-sm"
                  >
                    <div className="text-3xl mb-2">👤</div>
                    No users currently active
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(activeUsers ?? []).map((principal, idx) => {
                      const pStr = principal.toString();
                      return (
                        <div
                          key={pStr}
                          data-ocid={`users.active.item.${idx + 1}`}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ borderColor: "oklch(var(--border))" }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
                          <p className="font-mono text-sm">
                            {truncatePrincipal(pStr)}
                          </p>
                          <Badge
                            className="ml-auto text-[10px] bg-green-50 text-green-800 border-green-200"
                            variant="outline"
                          >
                            Online
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 4: Role Assignment ── */}
          <TabsContent value="roles">
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
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        roleInfo?.color ?? ""
                      }`}
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
                  must first sign in with Internet Identity before you can
                  assign their role.
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
                    disabled={
                      !targetPrincipal.trim() || assignMutation.isPending
                    }
                    onClick={() =>
                      assignMutation.mutate({ role: UserRole.admin })
                    }
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
                    disabled={
                      !targetPrincipal.trim() || assignMutation.isPending
                    }
                    onClick={() =>
                      assignMutation.mutate({ role: UserRole.user })
                    }
                    className="flex-1 min-w-[120px]"
                  >
                    Make User
                  </Button>
                  <Button
                    data-ocid="users.delete_button"
                    variant="outline"
                    disabled={
                      !targetPrincipal.trim() || assignMutation.isPending
                    }
                    onClick={() =>
                      assignMutation.mutate({ role: UserRole.guest })
                    }
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
