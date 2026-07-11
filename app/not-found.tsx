import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-neutral-900">404</h1>
      <p className="mt-2 text-sm text-neutral-500">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800">
        Go Home
      </Link>
    </div>
  );
}
