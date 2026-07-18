import { Response } from "express";
import { Types } from "mongoose";
import { Application } from "../models/Application";
import { Job } from "../models/Job";
import { applySchema, updateApplicationStatusSchema } from "../utils/validation";
import { AuthRequest } from "../middleware/auth";
import { resumeUrlFor } from "../middleware/upload";

export async function applyToJob(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Resume file is required" });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }
  if (job.status === "closed") {
    return res.status(400).json({ message: "This job is no longer accepting applications" });
  }

  try {
    const application = await Application.create({
      job: job._id,
      candidate: req.user!.userId,
      resumeUrl: resumeUrlFor(req.file.filename),
      resumeOriginalName: req.file.originalname,
      coverNote: parsed.data.coverNote,
    });

    return res.status(201).json({ application });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return res.status(409).json({ message: "You have already applied to this job" });
    }
    throw err;
  }
}

export async function myApplications(req: AuthRequest, res: Response) {
  const applications = await Application.find({ candidate: req.user!.userId })
    .sort({ createdAt: -1 })
    .populate({ path: "job", select: "title location workMode jobType status" });

  return res.json({ applications });
}

export async function jobApplicants(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  const isOwner = job.postedBy.toString() === req.user!.userId;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "You do not have permission to view these applicants" });
  }

  const applications = await Application.find({ job: jobId })
    .sort({ createdAt: -1 })
    .populate({ path: "candidate", select: "name email" });

  return res.json({ applications });
}

export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const parsed = updateApplicationStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  const application = await Application.findById(id).populate<{ job: { postedBy: Types.ObjectId } }>(
    "job",
    "postedBy"
  );
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  const isOwner = application.job.postedBy.toString() === req.user!.userId;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "You do not have permission to update this application" });
  }

  application.status = parsed.data.status;
  await application.save();

  return res.json({ application });
}
