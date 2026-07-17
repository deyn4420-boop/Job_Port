export type UserRole = "jobseeker" | "recruiter" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type JobStatus = "open" | "closed";

export interface Job {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  salaryMin?: number;
  salaryMax?: number;
  status: JobStatus;
  postedBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: JobType;
  workMode?: WorkMode;
  skills?: string;
  salaryMin?: number;
  page?: number;
}
