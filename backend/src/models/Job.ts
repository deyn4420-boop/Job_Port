import { Schema, model, Document, Types } from "mongoose";

export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type JobStatus = "open" | "closed";

export interface IJob extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  skills: string[];
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  salaryMin?: number;
  salaryMax?: number;
  postedBy: Types.ObjectId;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    location: { type: String, required: true, trim: true },
    workMode: { type: String, enum: ["remote", "hybrid", "onsite"], required: true },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      required: true,
    },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", description: "text", skills: "text" });

export const Job = model<IJob>("Job", jobSchema);
