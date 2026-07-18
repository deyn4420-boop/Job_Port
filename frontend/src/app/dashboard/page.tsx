"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchMyJobs } from "@/lib/jobsApi";
import { fetchMyApplications } from "@/lib/applicationsApi";
import { Job, Application, ApplicationStatus } from "@/types";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-gray-100 text-gray-700",
  shortlisted: "bg-blue-100 text-blue-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.role === "recruiter" || user?.role === "admin") {
      void Promise.resolve().then(() => {
        setDataLoading(true);
        fetchMyJobs()
          .then((data) => setJobs(data.jobs))
          .catch((err) => setError(err instanceof Error ? err.message : "Failed to load postings"))
          .finally(() => setDataLoading(false));
      });
    } else if (user?.role === "jobseeker") {
      void Promise.resolve().then(() => {
        setDataLoading(true);
        fetchMyApplications()
          .then((data) => setApplications(data.applications))
          .catch((err) => setError(err instanceof Error ? err.message : "Failed to load applications"))
          .finally(() => setDataLoading(false));
      });
    }
  }, [user]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!user) return null; // redirect is in flight

  return (
    <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">
          Welcome, {user.name} <span className="text-gray-400 text-base">({user.role})</span>
        </h1>
        <button
          onClick={() => logout().then(() => router.push("/login"))}
          className="text-sm text-gray-600 underline"
        >
          Log out
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {user.role === "recruiter" || user.role === "admin" ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Your postings</h2>
            <Link href="/jobs/new" className="text-sm rounded-md bg-black text-white px-3 py-1.5">
              Post a job
            </Link>
          </div>

          {dataLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-gray-500">You haven&apos;t posted any jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3"
                >
                  <Link href={`/jobs/${job._id}`} className="min-w-0">
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.location}</p>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        job.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {job.status}
                    </span>
                    <Link href={`/jobs/${job._id}/applicants`} className="text-xs underline text-gray-600">
                      Applicants
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="font-medium mb-4">Your applications</h2>

          {dataLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-gray-500">
              You haven&apos;t applied to any jobs yet.{" "}
              <Link href="/jobs" className="underline">
                Browse open jobs
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => {
                const job = typeof app.job === "object" ? app.job : null;
                return (
                  <Link
                    key={app._id}
                    href={job ? `/jobs/${job._id}` : "#"}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 hover:border-gray-400"
                  >
                    <div>
                      <p className="text-sm font-medium">{job?.title ?? "Job posting removed"}</p>
                      <p className="text-xs text-gray-500">{job?.location}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_STYLES[app.status]}`}>
                      {app.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
