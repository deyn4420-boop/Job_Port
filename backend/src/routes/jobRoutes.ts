import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Public: anyone can browse jobs
router.get("/", (req, res) => {
  res.json({ message: "List of jobs (public) — implement Job model + query next" });
});

// Protected + role-gated: only recruiters can post jobs
router.post("/", requireAuth, requireRole("recruiter", "admin"), (req, res) => {
  res.json({ message: "Job created (stub) — implement Job model next" });
});

export default router;
