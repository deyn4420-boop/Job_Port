"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchJobApplicants, updateApplicationStatus, resolveResumeUrl } from "@/lib/applicationsApi";
import { fetchJob } from "@/lib/jobsApi";
import { Application, ApplicationStatus, Job } from "@/types";

const STATUS_OPTIONS: ApplicationStatus[] = ["applied", "shortlisted", "rejected", "hired"];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-gray-100 text-gray-700",
  shortlisted: "bg-blue-100 text-blue-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function matchScoreStyle(score: number): string {
  if (score >= 75) return "bg-green-100 text-green-700";
  if (score >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
}

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role === "jobseeker")) {
      router.push("/jobs");
    }
  }, [authLoading, user, router]);

  const loadData = useCallback(
    (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) {
        setLoading(true);
      }

      return Promise.all([fetchJob(id), fetchJobApplicants(id)])
        .then(([jobData, appsData]) => {
          setJob(jobData.job);
          setApplications(appsData.applications);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load applicants"))
        .finally(() => setLoading(false));
    },
    [id]
  );

  useEffect(() => {
    if (!user || user.role === "jobseeker") {
      return;
    }

    void loadData();
  }, [user, loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadData({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStatusChange(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    try {
      const { application } = await updateApplicationStatus(applicationId, status);
      setApplications((prev) => prev.map((a) => (a._id === application._id ? application : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!user || user.role === "jobseeker") {
    return null;
  }

  const hasUnscored = applications.some((application) => application.matchScore === undefined);

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
        Back to dashboard
      </Link>

      <div className="flex items-center justify-between mt-4">
        <h1 className="text-2xl font-semibold">
          Applicants {job && <span className="text-gray-400 font-normal">- {job.title}</span>}
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-sm text-gray-600 underline disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {hasUnscored && (
        <p className="text-xs text-gray-400 mt-1">
          Some applications are still being scored. Refresh in a few seconds.
        </p>
      )}

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {applications.length === 0 ? (
        <p className="text-sm text-gray-500 mt-6">No applications yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {applications.map((app) => {
            const candidate = typeof app.candidate === "object" ? app.candidate : null;

            return (
              <div key={app._id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{candidate?.name ?? "Candidate"}</p>
                    <p className="text-sm text-gray-500">{candidate?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {app.matchScore !== undefined ? (
                      <span className={`text-xs rounded-full px-2 py-1 font-medium ${matchScoreStyle(app.matchScore)}`}>
                        {app.matchScore}% match
                      </span>
                    ) : (
                      <span className="text-xs rounded-full px-2 py-1 bg-gray-50 text-gray-400">Scoring...</span>
                    )}
                    <span className={`text-xs rounded-full px-2 py-1 whitespace-nowrap ${STATUS_STYLES[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {app.matchSummary && <p className="text-sm text-gray-700 mt-3">{app.matchSummary}</p>}

                {(app.matchedSkills?.length || app.missingSkills?.length) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {app.matchedSkills?.map((skill) => (
                      <span key={`m-${skill}`} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5">
                        matched: {skill}
                      </span>
                    ))}
                    {app.missingSkills?.map((skill) => (
                      <span key={`x-${skill}`} className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                        missing: {skill}
                      </span>
                    ))}
                  </div>
                )}

                {app.coverNote && <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{app.coverNote}</p>}

                <div className="flex items-center justify-between mt-4">
                  <a
                    href={resolveResumeUrl(app.resumeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline text-gray-700"
                  >
                    View resume ({app.resumeOriginalName})
                  </a>

                  <select
                    value={app.status}
                    disabled={updatingId === app._id}
                    onChange={(e) => handleStatusChange(app._id, e.target.value as ApplicationStatus)}
                    className="text-sm rounded-md border border-gray-300 px-2 py-1"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
