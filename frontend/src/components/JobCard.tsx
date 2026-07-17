import Link from "next/link";
import { Job } from "@/types";

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  if (job.salaryMin && job.salaryMax) return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin) return `From $${job.salaryMin.toLocaleString()}`;
  return `Up to $${job.salaryMax!.toLocaleString()}`;
}

export function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);
  const companyName = typeof job.postedBy === "object" ? job.postedBy.name : "Company";

  return (
    <Link
      href={`/jobs/${job._id}`}
      className="block rounded-lg border border-gray-200 p-4 hover:border-gray-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">{job.title}</h3>
          <p className="text-sm text-gray-500">{companyName} - {job.location}</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-gray-400 whitespace-nowrap">
          {job.workMode}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
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
  );
}
