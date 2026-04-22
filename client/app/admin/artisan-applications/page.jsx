"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  approveAdminArtisanApplication,
  getAdminArtisanApplications,
  rejectAdminArtisanApplication,
} from "@/lib/artisan-store";
import { getCurrentUser, isAdminUser } from "@/lib/admin-store";

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected"];

export default function AdminArtisanApplicationsPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [rejectReasonById, setRejectReasonById] = useState({});
  const [processingIds, setProcessingIds] = useState([]);

  const loadApplications = async (status) => {
    const next = await getAdminArtisanApplications(status === "all" ? "" : status);
    setApplications(next);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = getCurrentUser();
      if (!isAdminUser(user)) {
        router.push("/");
        return;
      }

      const next = await getAdminArtisanApplications("");
      if (!active) return;
      setApplications(next);
      setHydrated(true);
    };

    load()
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load applications.");
        setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    loadApplications(statusFilter).catch((filterError) => {
      setError(filterError instanceof Error ? filterError.message : "Failed to filter applications.");
    });
  }, [statusFilter, hydrated]);

  const pendingCount = useMemo(
    () => applications.filter((application) => application.status === "pending").length,
    [applications]
  );

  const setProcessing = (id, processing) => {
    setProcessingIds((prev) => {
      if (processing) return [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const handleApprove = async (applicationId) => {
    setError("");
    setProcessing(applicationId, true);
    try {
      await approveAdminArtisanApplication(applicationId);
      await loadApplications(statusFilter);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Approval failed.");
    } finally {
      setProcessing(applicationId, false);
    }
  };

  const handleReject = async (applicationId) => {
    setError("");
    const reason = String(rejectReasonById[applicationId] || "").trim();
    if (!reason) {
      setError("Rejection reason is required.");
      return;
    }

    setProcessing(applicationId, true);
    try {
      await rejectAdminArtisanApplication(applicationId, reason);
      await loadApplications(statusFilter);
      setRejectReasonById((prev) => ({ ...prev, [applicationId]: "" }));
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Rejection failed.");
    } finally {
      setProcessing(applicationId, false);
    }
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
          Artisan Applications
        </h1>
        <p className="text-muted-foreground">
          Review applications and approve artisan onboarding.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Total: {applications.length} · Pending: {pendingCount}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all"
                    ? "All statuses"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {applications.map((application) => {
        const isProcessing = processingIds.includes(application.id);
        return (
          <Card key={application.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">{application.fullName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {application.email} · {application.phone}
                </p>
              </div>
              <Badge variant="outline" className="w-fit capitalize">
                {application.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p>
                    <strong>District:</strong> {application.districtName}
                  </p>
                  <p className="mt-1">
                    <strong>Specialty:</strong> {application.specialty}
                  </p>
                  <p className="mt-1">
                    <strong>Experience:</strong> {application.yearsOfExperience} years
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p>
                    <strong>Status:</strong> {application.status}
                  </p>
                  <p className="mt-1">
                    <strong>Applied:</strong> {new Date(application.createdAt).toLocaleString()}
                  </p>
                  {application.reviewedAt && (
                    <p className="mt-1">
                      <strong>Reviewed:</strong>{" "}
                      {new Date(application.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium text-foreground">Bio</p>
                <p className="mt-1 text-muted-foreground">{application.bio}</p>
              </div>

              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium text-foreground">Story</p>
                <p className="mt-1 text-muted-foreground">{application.story}</p>
              </div>

              {application.rejectionReason && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                  <strong>Last Rejection Reason:</strong> {application.rejectionReason}
                </div>
              )}

              {application.status === "pending" && (
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div className="space-y-2">
                    <Label htmlFor={`reject-${application.id}`}>Rejection reason</Label>
                    <Input
                      id={`reject-${application.id}`}
                      placeholder="Add reason if rejecting this application"
                      value={rejectReasonById[application.id] || ""}
                      onChange={(event) =>
                        setRejectReasonById((prev) => ({
                          ...prev,
                          [application.id]: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleApprove(application.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(application.id)}
                      disabled={isProcessing}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {applications.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No artisan applications found for this filter.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
