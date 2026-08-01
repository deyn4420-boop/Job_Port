"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { saveJob, unsaveJob } from "@/lib/savedJobsApi";

export function SaveButton({
  jobId,
  initialSaved,
  onChange,
}: {
  jobId: string;
  initialSaved: boolean;
  onChange?: (saved: boolean) => void;
}) {
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const saved = optimisticSaved ?? initialSaved;

  async function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (pending) return;

    const nextSaved = !saved;
    setOptimisticSaved(nextSaved);
    setPending(true);

    try {
      if (nextSaved) {
        await saveJob(jobId);
      } else {
        await unsaveJob(jobId);
      }
      onChange?.(nextSaved);
    } catch {
      setOptimisticSaved(null);
    } finally {
      setOptimisticSaved(null);
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Unsave job" : "Save job"}
      className={`text-xs rounded-md border px-2.5 py-1.5 shrink-0 transition-colors disabled:opacity-50 ${
        saved
          ? "border-black bg-black text-white"
          : "border-gray-300 text-gray-600 bg-white hover:border-gray-400"
      }`}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
