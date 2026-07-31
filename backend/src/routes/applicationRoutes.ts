import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { resumeUpload } from "../middleware/upload";
import {
  applyToJob,
  myApplications,
  jobApplicants,
  updateApplicationStatus,
} from "../controllers/applicationController";

const router = Router();

// Job seeker applies to a specific job, with resume file upload
router.post(
  "/jobs/:jobId/apply",
  requireAuth,
  requireRole("jobseeker"),
  resumeUpload.single("resume"),
  applyToJob
);

// Job seeker's own application history
router.get("/me", requireAuth, requireRole("jobseeker"), myApplications);

// Recruiter viewing applicants for one of their jobs
router.get(
  "/jobs/:jobId/applicants",
  requireAuth,
  requireRole("recruiter", "admin"),
  jobApplicants
);

// Recruiter updating an applicant's status
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("recruiter", "admin"),
  updateApplicationStatus
);

export default router;
