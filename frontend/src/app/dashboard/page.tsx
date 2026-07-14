"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!user) return null; // redirect is in flight

  return (
    <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">
          Welcome, {user.name} <span className="text-gray-400 text-base">({user.role})</span>
        </h1>
        <button
          onClick={() => logout().then(() => router.push("/login"))}
          className="text-sm text-gray-600 underline"
        >
          Log out
        </button>
      </div>

      {user.role === "recruiter" ? (
        <p className="text-gray-600">
          Recruiter dashboard placeholder — this is where posted jobs and applicant lists will live.
        </p>
      ) : (
        <p className="text-gray-600">
          Job seeker dashboard placeholder — this is where applied jobs and status tracking will live.
        </p>
      )}
    </main>
  );
}
