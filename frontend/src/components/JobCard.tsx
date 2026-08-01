import Link from "next/link";
import { Job } from "@/types";
import { SaveButton } from "./SaveButton";

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  if (job.salaryMin && job.salaryMax) return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin) return `From $${job.salaryMin.toLocaleString()}`;
  return `Up to $${job.salaryMax!.toLocaleString()}`;
}

export function JobCard({
  job,
  saved,
  onToggleSave,
}: {
  job: Job;
  saved?: boolean;
  onToggleSave?: (saved: boolean) => void;
}) {
  const salary = formatSalary(job);
  const companyName = typeof job.postedBy === "object" ? job.postedBy.name : "Company";

  return (
    <div className="relative">
      <Link
        href={`/jobs/${job._id}`}
        className={`block rounded-lg border border-gray-200 p-4 hover:border-gray-400 transition-colors ${
          saved !== undefined ? "pr-24" : ""
        }`}
      >
        <div>
          <h3 className="font-medium">{job.title}</h3>
          <p className="text-sm text-gray-500">
            {companyName} - {job.location}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-xs uppercase tracking-wide text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
            {job.workMode}
          </span>
          {job.skills.slice(0, 5).map((skill) => (
            <span key={skill} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
          <span className="capitalize">{job.jobType.replace("-", " ")}</span>
          {salary && <span>{salary}</span>}
        </div>
      </Link>

      {saved !== undefined && (
        <div className="absolute top-4 right-4">
          <SaveButton jobId={job._id} initialSaved={saved} onChange={onToggleSave} />
        </div>
      )}
    </div>
  );
}
