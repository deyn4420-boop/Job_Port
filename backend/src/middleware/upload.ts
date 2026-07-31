import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Request } from "express";

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "resumes");

// Ensure the folder exists — matters on a fresh clone where uploads/ isn't committed
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

function fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, or DOCX files are allowed"));
  }
}

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// NOTE: this is local-disk storage, fine for development. In production, swap
// the `storage` engine for a Cloudinary/S3 multer adapter so files survive
// deploys/restarts — everywhere else in the app only cares about resumeUrl,
// so that swap doesn't touch the controller or model.
export function resumeUrlFor(filename: string): string {
  return `/uploads/resumes/${filename}`;
}
