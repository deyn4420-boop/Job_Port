"use client";

import { useState, FormEvent } from "react";
import { applyToJob } from "@/lib/applicationsApi";

interface Props {
  jobId: string;
  onApplied: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ApplyForm({ jobId, onApplied }: Props) {
  const [resume, setResume] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);

    if (file && file.size > MAX_FILE_SIZE) {
      setError("Resume must be under 5MB");
      setResume(null);
      return;
    }

    setResume(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!resume) {
      setError("Please attach your resume");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await applyToJob(jobId, resume, coverNote || undefined);
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-gray-200 p-4 space-y-4">
      <h2 className="font-medium">Apply to this job</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Resume (PDF, DOC, or DOCX, max 5MB)</label>
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="w-full text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cover note (optional)</label>
        <textarea
          rows={4}
          maxLength={2000}
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          placeholder="Briefly say why you're a good fit..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
