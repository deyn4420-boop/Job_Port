import { apiFetch } from "./apiClient";
import { Job, JobFilters, Pagination, JobType, WorkMode } from "@/types";

export interface CreateJobInput {
  title: string;
  description: string;
  skills: string[];
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  salaryMin?: number;
  salaryMax?: number;
}

export type UpdateJobInput = Partial<CreateJobInput> & { status?: "open" | "closed" };

function buildQueryString(filters: JobFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.location) params.set("location", filters.location);
  if (filters.jobType) params.set("jobType", filters.jobType);
  if (filters.workMode) params.set("workMode", filters.workMode);
  if (filters.skills) params.set("skills", filters.skills);
  if (filters.salaryMin) params.set("salaryMin", String(filters.salaryMin));
  params.set("page", String(filters.page ?? 1));
  return params.toString();
}

export async function fetchJobs(
  filters: JobFilters = {}
): Promise<{ jobs: Job[]; pagination: Pagination }> {
  const qs = buildQueryString(filters);
  return apiFetch(`/jobs?${qs}`, { skipAuth: true });
}

export async function fetchJob(id: string): Promise<{ job: Job }> {
  return apiFetch(`/jobs/${id}`, { skipAuth: true });
}

export async function fetchMyJobs(): Promise<{ jobs: Job[] }> {
  return apiFetch("/jobs/my-jobs");
}

export async function createJob(input: CreateJobInput): Promise<{ job: Job }> {
  return apiFetch("/jobs", { method: "POST", body: JSON.stringify(input) });
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<{ job: Job }> {
  return apiFetch(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteJob(id: string): Promise<void> {
  return apiFetch(`/jobs/${id}`, { method: "DELETE" });
}
