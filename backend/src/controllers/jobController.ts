import { Response } from "express";
import { Types } from "mongoose";
import { Job } from "../models/Job";
import { createJobSchema, updateJobSchema, jobQuerySchema } from "../utils/validation";
import { AuthRequest } from "../middleware/auth";

export async function createJob(req: AuthRequest, res: Response) {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  const job = await Job.create({ ...parsed.data, postedBy: req.user!.userId });
  return res.status(201).json({ job });
}

export async function listJobs(req: AuthRequest, res: Response) {
  const parsed = jobQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query params", errors: parsed.error.flatten() });
  }

  const { search, location, jobType, workMode, skills, salaryMin, page, limit } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { status: "open" };

  if (search) filter.$text = { $search: search };
  if (location) filter.location = { $regex: location, $options: "i" };
  if (jobType) filter.jobType = jobType;
  if (workMode) filter.workMode = workMode;
  if (skills) filter.skills = { $in: skills.split(",").map((s) => s.trim()) };
  if (salaryMin) filter.salaryMax = { $gte: salaryMin }; // job's max salary meets candidate's floor

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "name email"),
    Job.countDocuments(filter),
  ]);

  return res.json({
    jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getJob(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const job = await Job.findById(id).populate("postedBy", "name email");
  if (!job) return res.status(404).json({ message: "Job not found" });

  return res.json({ job });
}

// Only the recruiter who posted it (or an admin) may modify it
async function assertOwnerOrAdmin(req: AuthRequest, job: { postedBy: Types.ObjectId }) {
  const isOwner = job.postedBy.toString() === req.user!.userId;
  const isAdmin = req.user!.role === "admin";
  return isOwner || isAdmin;
}

export async function updateJob(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const parsed = updateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  const job = await Job.findById(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (!(await assertOwnerOrAdmin(req, job))) {
    return res.status(403).json({ message: "You do not have permission to edit this job" });
  }

  Object.assign(job, parsed.data);
  await job.save();

  return res.json({ job });
}

export async function deleteJob(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const job = await Job.findById(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (!(await assertOwnerOrAdmin(req, job))) {
    return res.status(403).json({ message: "You do not have permission to delete this job" });
  }

  await job.deleteOne();
  return res.status(204).send();
}

// Recruiter's own postings, including closed ones - used for their dashboard
export async function myJobs(req: AuthRequest, res: Response) {
  const jobs = await Job.find({ postedBy: req.user!.userId }).sort({ createdAt: -1 });
  return res.json({ jobs });
}
