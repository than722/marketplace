import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold">Listing not found</h1>
      <Link href="/" className="mt-4 inline-block text-blue-600 underline">
        Back to the marketplace
      </Link>
    </div>
  );
}
