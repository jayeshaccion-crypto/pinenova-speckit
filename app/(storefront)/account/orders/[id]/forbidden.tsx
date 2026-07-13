import Link from "next/link";

export default function OrderForbiddenPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-foreground">403</h1>
      <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view this order.</p>
      <Link href="/account" className="mt-6 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Back to Account
      </Link>
    </div>
  );
}