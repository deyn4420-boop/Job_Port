import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["jobseeker", "recruiter"]), // admin accounts aren't self-registered
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const jobTypeEnum = z.enum(["full-time", "part-time", "contract", "internship"]);
const workModeEnum = z.enum(["remote", "hybrid", "onsite"]);

export const createJobSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    skills: z.array(z.string().min(1)).default([]),
    location: z.string().min(2, "Location is required"),
    workMode: workModeEnum,
    jobType: jobTypeEnum,
    salaryMin: z.number().int().min(0).optional(),
    salaryMax: z.number().int().min(0).optional(),
  })
  .refine((data) => !data.salaryMin || !data.salaryMax || data.salaryMin <= data.salaryMax, {
    message: "salaryMin cannot be greater than salaryMax",
    path: ["salaryMin"],
  });

export const updateJobSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(20).optional(),
    skills: z.array(z.string().min(1)).optional(),
    location: z.string().min(2).optional(),
    workMode: workModeEnum.optional(),
    jobType: jobTypeEnum.optional(),
    salaryMin: z.number().int().min(0).optional(),
    salaryMax: z.number().int().min(0).optional(),
    status: z.enum(["open", "closed"]).optional(),
  })
  .refine((data) => !data.salaryMin || !data.salaryMax || data.salaryMin <= data.salaryMax, {
    message: "salaryMin cannot be greater than salaryMax",
    path: ["salaryMin"],
  });

export const jobQuerySchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  jobType: jobTypeEnum.optional(),
  workMode: workModeEnum.optional(),
  skills: z.string().optional(), // comma-separated, split in controller
  salaryMin: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobQueryInput = z.infer<typeof jobQuerySchema>;
