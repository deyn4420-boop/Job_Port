"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchSavedJobs } from "@/lib/savedJobsApi";
import { Job } from "@/types";
import { JobCard } from "@/components/JobCard";

export default function SavedJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "jobseeker")) {
      router.push("/jobs");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === "jobseeker") {
      fetchSavedJobs()
        .then((data) => setJobs(data.jobs))
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load saved jobs"))
        .finally(() => setDataLoading(false));
    }
  }, [user]);

  function handleToggle(jobId: string, saved: boolean) {
    if (!saved) {
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
    }
  }

  if (authLoading || !user || user.role !== "jobseeker") return null;

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Saved jobs</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {dataLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-gray-500">
          You haven&apos;t saved any jobs yet.{" "}
          <Link href="/jobs" className="underline">
            Browse open jobs
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              saved={true}
              onToggleSave={(saved) => handleToggle(job._id, saved)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
