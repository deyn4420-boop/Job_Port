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

router.post(
  "/jobs/:jobId/apply",
  requireAuth,
  requireRole("jobseeker"),
  resumeUpload.single("resume"),
  applyToJob
);

router.get("/me", requireAuth, requireRole("jobseeker"), myApplications);

router.get(
  "/jobs/:jobId/applicants",
  requireAuth,
  requireRole("recruiter", "admin"),
  jobApplicants
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("recruiter", "admin"),
  updateApplicationStatus
);

export default router;
