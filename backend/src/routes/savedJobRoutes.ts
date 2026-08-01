import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { listSavedJobs, listSavedJobIds, saveJob, unsaveJob } from "../controllers/savedJobController";

const router = Router();

router.get("/", requireAuth, requireRole("jobseeker"), listSavedJobs);
router.get("/ids", requireAuth, requireRole("jobseeker"), listSavedJobIds);
router.post("/:jobId", requireAuth, requireRole("jobseeker"), saveJob);
router.delete("/:jobId", requireAuth, requireRole("jobseeker"), unsaveJob);

export default router;
