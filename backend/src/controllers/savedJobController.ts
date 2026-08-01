import { Response } from "express";
import { Types } from "mongoose";
import { SavedJob } from "../models/SavedJob";
import { Job } from "../models/Job";
import { AuthRequest } from "../middleware/auth";

export async function listSavedJobs(req: AuthRequest, res: Response) {
  const saved = await SavedJob.find({ user: req.user!.userId })
    .sort({ createdAt: -1 })
    .populate({
      path: "job",
      populate: { path: "postedBy", select: "name email" },
    });

  const jobs = saved.filter((savedJob) => savedJob.job).map((savedJob) => savedJob.job);

  return res.json({ jobs });
}

export async function listSavedJobIds(req: AuthRequest, res: Response) {
  const saved = await SavedJob.find({ user: req.user!.userId }, "job");
  return res.json({ jobIds: saved.map((savedJob) => savedJob.job.toString()) });
}

export async function saveJob(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  try {
    await SavedJob.create({ user: req.user!.userId, job: jobId });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return res.status(200).json({ saved: true });
    }
    throw err;
  }

  return res.status(201).json({ saved: true });
}

export async function unsaveJob(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  await SavedJob.deleteOne({ user: req.user!.userId, job: jobId });
  return res.status(204).send();
}
