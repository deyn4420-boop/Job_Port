import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  myJobs,
} from "../controllers/jobController";

const router = Router();

// Public: browse/search open jobs
router.get("/", listJobs);

// Recruiter's own postings - must come before "/:id" so "my-jobs" isn't parsed as an id
router.get("/my-jobs", requireAuth, requireRole("recruiter", "admin"), myJobs);

router.get("/:id", getJob);

router.post("/", requireAuth, requireRole("recruiter", "admin"), createJob);
router.patch("/:id", requireAuth, requireRole("recruiter", "admin"), updateJob);
router.delete("/:id", requireAuth, requireRole("recruiter", "admin"), deleteJob);

export default router;
