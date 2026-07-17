"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchMyJobs } from "@/lib/jobsApi";
import { Job } from "@/types";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.role === "recruiter" || user?.role === "admin") {
      void Promise.resolve().then(() => {
        setJobsLoading(true);
        fetchMyJobs()
          .then((data) => setJobs(data.jobs))
          .catch((err) => setError(err instanceof Error ? err.message : "Failed to load postings"))
          .finally(() => setJobsLoading(false));
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

      {user.role === "recruiter" || user.role === "admin" ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Your postings</h2>
            <Link href="/jobs/new" className="text-sm rounded-md bg-black text-white px-3 py-1.5">
              Post a job
            </Link>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {jobsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-gray-500">You haven&apos;t posted any jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/jobs/${job._id}`}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 hover:border-gray-400"
                >
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.location}</p>
                  </div>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      job.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600">
          Job seeker dashboard placeholder - applied jobs and status tracking land here once the application
          flow is built.{" "}
          <Link href="/jobs" className="underline">
            Browse open jobs
          </Link>{" "}
          in the meantime.
        </p>
      )}
    </main>
  );
}
