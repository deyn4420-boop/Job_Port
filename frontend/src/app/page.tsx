import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Find your next role.</h1>
        <p className="text-gray-500 mt-3">
          Or find your next hire. A job portal built with matching that actually reads the room.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/jobs" className="rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium">
            Browse jobs
          </Link>
          <Link href="/register" className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium">
            Get started
          </Link>
        </div>
      </div>
    </main>
  );
}
