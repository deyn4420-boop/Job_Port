import { apiFetch } from "./apiClient";
import { Application, ApplicationStatus } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function applyToJob(
  jobId: string,
  resume: File,
  coverNote?: string
): Promise<{ application: Application }> {
  const formData = new FormData();
  formData.append("resume", resume);
  if (coverNote) {
    formData.append("coverNote", coverNote);
  }

  return apiFetch(`/applications/jobs/${jobId}/apply`, {
    method: "POST",
    body: formData,
  });
}

export async function fetchMyApplications(): Promise<{ applications: Application[] }> {
  return apiFetch("/applications/me");
}

export async function fetchJobApplicants(jobId: string): Promise<{ applications: Application[] }> {
  return apiFetch(`/applications/jobs/${jobId}/applicants`);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<{ application: Application }> {
  return apiFetch(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function resolveResumeUrl(resumeUrl: string): string {
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${apiOrigin}${resumeUrl}`;
}
