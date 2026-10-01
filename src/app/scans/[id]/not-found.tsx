import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Scan not found</h1>
      <p className="mt-2">
        <Link href="/" className="text-blue-800 underline">Back to home</Link>
      </p>
    </div>
  );
}
