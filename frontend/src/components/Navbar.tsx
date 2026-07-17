"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-gray-200">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/jobs" className="font-semibold">
          Job Portal
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/jobs" className="text-gray-600 hover:text-black">
            Browse Jobs
          </Link>

          {user?.role === "recruiter" && (
            <>
              <Link href="/jobs/new" className="text-gray-600 hover:text-black">
                Post a Job
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-black">
                My Postings
              </Link>
            </>
          )}

          {user ? (
            <button
              onClick={() => logout().then(() => router.push("/login"))}
              className="text-gray-600 hover:text-black"
            >
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-black">
                Log in
              </Link>
              <Link href="/register" className="rounded-md bg-black text-white px-3 py-1.5">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
