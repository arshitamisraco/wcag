import Link from "next/link";
import { cn } from "./cn";

const LINK_CLASSES =
  "rounded-sm font-bold text-sky-deep underline decoration-2 underline-offset-4 hover:bg-yellow-soft hover:decoration-4";

export function TextLink({
  href,
  external,
  children,
  className,
  ...rest
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(LINK_CLASSES, className)}
        {...rest}
      >
        {children}
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cn(LINK_CLASSES, className)} {...rest}>
      {children}
    </Link>
  );
}
