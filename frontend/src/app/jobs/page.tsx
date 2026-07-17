"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchJobs } from "@/lib/jobsApi";
import { Job, JobFilters, Pagination, JobType, WorkMode } from "@/types";
import { JobCard } from "@/components/JobCard";

const JOB_TYPES: JobType[] = ["full-time", "part-time", "contract", "internship"];
const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw text inputs (debounced before becoming real filters)
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [filters, setFilters] = useState<JobFilters>({ page: 1 });

  const loadJobs = useCallback(async (f: JobFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs(f);
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadJobs(filters));
  }, [filters, loadJobs]);

  // Debounce free-text inputs so we're not hitting the API on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput || undefined,
        location: locationInput || undefined,
        page: 1,
      }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput, locationInput]);

  function updateFilter<K extends keyof JobFilters>(key: K, value: JobFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function goToPage(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Browse Jobs</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          placeholder="Search title, description, skills..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Location"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={filters.jobType ?? ""}
          onChange={(e) => updateFilter("jobType", (e.target.value || undefined) as JobType | undefined)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Any job type</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("-", " ")}
            </option>
          ))}
        </select>
        <select
          value={filters.workMode ?? ""}
          onChange={(e) => updateFilter("workMode", (e.target.value || undefined) as WorkMode | undefined)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Any work mode</option>
          {WORK_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-gray-500">No jobs match your filters.</p>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8 text-sm">
          <button
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
            className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
            className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
