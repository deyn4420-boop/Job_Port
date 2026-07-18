"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchJob, deleteJob } from "@/lib/jobsApi";
import { Job } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ApplyForm } from "@/components/ApplyForm";

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  if (job.salaryMin && job.salaryMax) return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin) return `From $${job.salaryMin.toLocaleString()}`;
  return `Up to $${job.salaryMax!.toLocaleString()}`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchJob(id)
      .then((data) => setJob(data.job))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  const ownerId = job && typeof job.postedBy === "object" ? job.postedBy._id : job?.postedBy;
  const isOwner = user && ownerId === user.id;

  async function handleDelete() {
    if (!job || !confirm("Delete this job posting? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteJob(job._id);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <p className="text-sm text-red-600">{error || "Job not found"}</p>
        <Link href="/jobs" className="text-sm underline mt-2 inline-block">
          Back to jobs
        </Link>
      </main>
    );
  }

  const companyName = typeof job.postedBy === "object" ? job.postedBy.name : "Company";
  const salary = formatSalary(job);

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
      <Link href="/jobs" className="text-sm text-gray-500 hover:underline">
        Back to jobs
      </Link>

      <div className="flex items-start justify-between mt-4 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="text-gray-500 mt-1">
            {companyName} - {job.location} - <span className="capitalize">{job.workMode}</span>
          </p>
        </div>
        {job.status === "closed" && (
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-1 whitespace-nowrap">
            Closed
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
        <span className="capitalize">{job.jobType.replace("-", " ")}</span>
        {salary && <span>{salary}</span>}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {job.skills.map((skill) => (
          <span key={skill} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
            {skill}
          </span>
        ))}
      </div>

      <p className="mt-6 whitespace-pre-wrap text-gray-800 leading-relaxed">{job.description}</p>

      {isOwner ? (
        <div className="flex gap-2 mt-8">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-300 text-red-600 px-4 py-2 text-sm disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete posting"}
          </button>
        </div>
      ) : user?.role === "jobseeker" ? (
        <div>
          {applied ? (
            <p className="mt-8 text-sm text-green-700 bg-green-50 rounded-md px-4 py-3">
              Application submitted! You can track its status from your dashboard.
            </p>
          ) : showApplyForm ? (
            <ApplyForm jobId={job._id} onApplied={() => setApplied(true)} />
          ) : (
            <button
              disabled={job.status === "closed"}
              onClick={() => setShowApplyForm(true)}
              className="mt-8 rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              {job.status === "closed" ? "Applications closed" : "Apply now"}
            </button>
          )}
        </div>
      ) : null}
    </main>
  );
}
