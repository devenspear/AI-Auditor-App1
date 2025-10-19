import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-6xl font-bold text-primary mb-4">404</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Report Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The report you&apos;re looking for doesn&apos;t exist or may have been deleted.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
