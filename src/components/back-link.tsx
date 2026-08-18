import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </Link>
  );
}
