import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  myJobs,
  updateJob,
} from "../controllers/jobController";

const router = Router();

router.get("/", listJobs);
router.get("/my-jobs", requireAuth, requireRole("recruiter", "admin"), myJobs);
router.get("/:id", getJob);

router.post("/", requireAuth, requireRole("recruiter", "admin"), createJob);
router.patch("/:id", requireAuth, requireRole("recruiter", "admin"), updateJob);
router.delete("/:id", requireAuth, requireRole("recruiter", "admin"), deleteJob);

export default router;
