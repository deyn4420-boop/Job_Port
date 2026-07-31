import { Response } from "express";
import { Types } from "mongoose";
import { Application } from "../models/Application";
import { Job } from "../models/Job";
import { User } from "../models/User";
import { applySchema, updateApplicationStatusSchema } from "../utils/validation";
import { AuthRequest } from "../middleware/auth";
import { resumeUrlFor } from "../middleware/upload";
import { extractResumeText } from "../utils/resumeParser";
import { scoreResumeMatch } from "../utils/aiMatcher";
import { notifyRecruiterOfApplication, notifyCandidateOfStatusChange } from "../utils/notifications";

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

  const job = await Job.findById(jobId).populate<{ postedBy: { name: string; email: string } }>(
    "postedBy",
    "name email"
  );
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

    res.status(201).json({ application });

    // Fire-and-forget: score the match after responding so the upload
    // doesn't wait on an LLM round-trip. The recruiter's applicant list
    // just shows "Scoring..." until this finishes and updates the doc.
    runMatchScoring(application._id.toString(), job, req.file.path, req.file.mimetype).catch((err) =>
      console.error("Background match scoring crashed:", err)
    );

    // Fire-and-forget: let the recruiter know a new application came in.
    User.findById(req.user!.userId, "name")
      .then((candidate) => {
        if (!candidate) return;
        notifyRecruiterOfApplication({
          recruiterEmail: job.postedBy.email,
          candidateName: candidate.name,
          jobTitle: job.title,
          jobId: job._id.toString(),
        });
      })
      .catch((err) => console.error("Failed to look up candidate for notification:", err));

    return;
  } catch (err: unknown) {
    // Unique index on (job, candidate) - this is the "already applied" case
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return res.status(409).json({ message: "You have already applied to this job" });
    }
    throw err;
  }
}

async function runMatchScoring(
  applicationId: string,
  job: { title: string; description: string; skills: string[] },
  resumeFilePath: string,
  resumeMimetype: string
) {
  const resumeText = await extractResumeText(resumeFilePath, resumeMimetype);
  const result = await scoreResumeMatch(job.title, job.description, job.skills, resumeText);

  if (!result) return; // AI unavailable, parsing failed, etc. — application stays scoreless, not broken

  await Application.findByIdAndUpdate(applicationId, {
    matchScore: result.matchScore,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    matchSummary: result.summary,
  });
}

// Job seeker's own application history
export async function myApplications(req: AuthRequest, res: Response) {
  const applications = await Application.find({ candidate: req.user!.userId })
    .sort({ createdAt: -1 })
    .populate({ path: "job", select: "title location workMode jobType status" });

  return res.json({ applications });
}

// Recruiter viewing applicants for one of their job postings
export async function jobApplicants(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const isOwner = job.postedBy.toString() === req.user!.userId;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "You do not have permission to view these applicants" });
  }

  const applications = await Application.find({ job: jobId })
    .sort({ createdAt: -1 })
    .populate({ path: "candidate", select: "name email" });

  // Highest match score first; applications still being scored (or where
  // scoring failed/was skipped) have no matchScore and sort to the bottom.
  applications.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

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

  const application = await Application.findById(id)
    .populate<{ job: { _id: Types.ObjectId; postedBy: Types.ObjectId; title: string } }>(
      "job",
      "postedBy title"
    )
    .populate<{ candidate: { email: string } }>("candidate", "email");
  if (!application) return res.status(404).json({ message: "Application not found" });

  const isOwner = application.job.postedBy.toString() === req.user!.userId;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "You do not have permission to update this application" });
  }

  application.status = parsed.data.status;
  await application.save();

  // Fire-and-forget: let the candidate know their status changed.
  notifyCandidateOfStatusChange({
    candidateEmail: application.candidate.email,
    jobTitle: application.job.title,
    status: application.status,
    jobId: application.job._id.toString(),
  });

  return res.json({ application });
}
