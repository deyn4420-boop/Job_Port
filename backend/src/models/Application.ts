import { Schema, model, Document, Types } from "mongoose";

export type ApplicationStatus = "applied" | "shortlisted" | "rejected" | "hired";

export interface IApplication extends Document {
  _id: Types.ObjectId;
  job: Types.ObjectId; // ref Job
  candidate: Types.ObjectId; // ref User
  resumeUrl: string;
  resumeOriginalName: string;
  coverNote?: string;
  status: ApplicationStatus;
  // Filled in later by the AI matching feature — left optional/null until then
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeUrl: { type: String, required: true },
    resumeOriginalName: { type: String, required: true },
    coverNote: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "hired"],
      default: "applied",
    },
    matchScore: { type: Number, min: 0, max: 100 },
    matchedSkills: { type: [String], default: undefined },
    missingSkills: { type: [String], default: undefined },
    matchSummary: { type: String },
  },
  { timestamps: true }
);

// One application per candidate per job — enforced at the DB level, not just in app code
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export const Application = model<IApplication>("Application", applicationSchema);
