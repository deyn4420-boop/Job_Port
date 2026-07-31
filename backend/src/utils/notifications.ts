import { sendEmail } from "./mailer";
import { ApplicationStatus } from "../models/Application";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// New application: notify the recruiter who owns the job
export function notifyRecruiterOfApplication(input: {
  recruiterEmail: string;
  candidateName: string;
  jobTitle: string;
  jobId: string;
}): void {
  const { recruiterEmail, candidateName, jobTitle, jobId } = input;
  sendEmail({
    to: recruiterEmail,
    subject: `New applicant for ${jobTitle}`,
    text: `${candidateName} just applied to your posting "${jobTitle}".\n\nView applicants: ${CLIENT_URL}/jobs/${jobId}/applicants`,
  }).catch((err) => console.error("notifyRecruiterOfApplication failed:", err));
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "received",
  shortlisted: "shortlisted",
  rejected: "not moving forward",
  hired: "hired",
};

// Application status change: notify the candidate
export function notifyCandidateOfStatusChange(input: {
  candidateEmail: string;
  jobTitle: string;
  status: ApplicationStatus;
  jobId: string;
}): void {
  const { candidateEmail, jobTitle, status, jobId } = input;
  sendEmail({
    to: candidateEmail,
    subject: `Update on your application for ${jobTitle}`,
    text: `Your application for "${jobTitle}" has been marked as ${STATUS_LABEL[status]}.\n\nView the posting: ${CLIENT_URL}/jobs/${jobId}`,
  }).catch((err) => console.error("notifyCandidateOfStatusChange failed:", err));
}

// Job details changed: notify everyone who applied while it was open
export function notifyApplicantsOfJobUpdate(input: {
  applicantEmails: string[];
  jobTitle: string;
  jobId: string;
}): void {
  const { applicantEmails, jobTitle, jobId } = input;
  for (const email of applicantEmails) {
    sendEmail({
      to: email,
      subject: `A job you applied to was updated: ${jobTitle}`,
      text: `The posting "${jobTitle}" was just updated by the recruiter.\n\nView the latest details: ${CLIENT_URL}/jobs/${jobId}`,
    }).catch((err) => console.error("notifyApplicantsOfJobUpdate failed:", err));
  }
}
