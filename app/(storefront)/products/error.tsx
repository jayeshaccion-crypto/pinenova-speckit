"use client";

export default function ProductsErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">Unable to load products</h1>
      <p className="mt-2 text-sm text-neutral-500">{error.message || "Something went wrong while fetching products. Please try again."}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  );
}
