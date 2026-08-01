import { apiFetch } from "./apiClient";
import { Job } from "@/types";

export async function fetchSavedJobs(): Promise<{ jobs: Job[] }> {
  return apiFetch("/saved-jobs");
}

export async function fetchSavedJobIds(): Promise<{ jobIds: string[] }> {
  return apiFetch("/saved-jobs/ids");
}

export async function saveJob(jobId: string): Promise<{ saved: boolean }> {
  return apiFetch(`/saved-jobs/${jobId}`, { method: "POST" });
}

export async function unsaveJob(jobId: string): Promise<void> {
  return apiFetch(`/saved-jobs/${jobId}`, { method: "DELETE" });
}
