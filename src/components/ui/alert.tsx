import { cn } from "./cn";

export type AlertTone = "info" | "success" | "error" | "neutral";

const TONES: Record<AlertTone, string> = {
  info: "bg-sky",
  success: "bg-green-soft",
  error: "bg-pink-soft",
  neutral: "bg-paper",
};

function AlertIcon({ tone }: { tone: AlertTone }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: "false" as const,
    className: "mt-0.5 shrink-0",
  };
  switch (tone) {
    case "success":
      return (
        <svg {...common} stroke="var(--green)">
          <circle cx="12" cy="12" r="9" />
          <path d="M7.5 12.5 11 16l5.5-7" />
        </svg>
      );
    case "error":
      return (
        <svg {...common} stroke="var(--red-deep)">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6M12 16.5v.5" />
        </svg>
      );
    case "info":
      return (
        <svg {...common} stroke="var(--ink)">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.5" />
        </svg>
      );
    case "neutral":
      return (
        <svg {...common} stroke="var(--ink)">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}

export function Alert({
  tone,
  title,
  children,
  role,
  className,
  ...rest
}: {
  tone: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  role?: "alert" | "status";
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "role" | "className" | "children">) {
  return (
    <div
      role={role}
      className={cn("flex gap-3 rounded-2xl border-2 border-ink p-4 text-ink", TONES[tone], className)}
      {...rest}
    >
      <AlertIcon tone={tone} />
      <div className="min-w-0 flex-1">
        {title ? <strong className="block font-display text-base">{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}
