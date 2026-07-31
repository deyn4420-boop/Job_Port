"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchJob, updateJob } from "@/lib/jobsApi";
import { Job, JobType, WorkMode } from "@/types";

const JOB_TYPES: JobType[] = ["full-time", "part-time", "contract", "internship"];
const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("remote");
  const [jobType, setJobType] = useState<JobType>("full-time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [status, setStatus] = useState<"open" | "closed">("open");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJob(id)
      .then((data) => {
        const j = data.job;
        setJob(j);
        setTitle(j.title);
        setDescription(j.description);
        setSkillsInput(j.skills.join(", "));
        setLocation(j.location);
        setWorkMode(j.workMode);
        setJobType(j.jobType);
        setSalaryMin(j.salaryMin != null ? String(j.salaryMin) : "");
        setSalaryMax(j.salaryMax != null ? String(j.salaryMax) : "");
        setStatus(j.status);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  const ownerId = job && typeof job.postedBy === "object" ? job.postedBy._id : job?.postedBy;
  const isOwner = user && ownerId === user.id;

  // Route guard: only the recruiter who owns this job (or an admin) may edit it
  useEffect(() => {
    if (authLoading || loading) return;
    if (!user || (!isOwner && user.role !== "admin")) {
      router.push(`/jobs/${id}`);
    }
  }, [authLoading, loading, user, isOwner, id, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateJob(id, {
        title,
        description,
        skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
        location,
        workMode,
        jobType,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        status,
      });
      router.push(`/jobs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (loadError || !job) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <p className="text-sm text-red-600">{loadError || "Job not found"}</p>
        <Link href="/dashboard" className="text-sm underline mt-2 inline-block">
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (!user || (!isOwner && user.role !== "admin")) return null; // redirect is in flight

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Edit job</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            required
            minLength={20}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
          <input
            placeholder="React, TypeScript, Node.js"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            required
            placeholder="Bengaluru, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Work mode</label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Job type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Salary min (optional)</label>
            <input
              type="number"
              min={0}
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salary max (optional)</label>
            <input
              type="number"
              min={0}
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "open" | "closed")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-md bg-black text-white py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
          <Link
            href={`/jobs/${id}`}
            className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
