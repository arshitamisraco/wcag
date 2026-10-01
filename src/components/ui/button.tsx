import Link from "next/link";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink font-bold font-display tracking-wide shadow-[4px_4px_0_0_var(--ink)] transition-[transform,box-shadow] duration-150 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--ink)] disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none disabled:bg-sand disabled:text-ink-2 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed min-h-11 no-underline";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-ink-2",
  secondary: "bg-yellow text-ink hover:bg-yellow-soft",
  accent: "bg-sky text-ink",
  ghost: "bg-paper text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm min-h-10",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
};

/** Class string for styling a raw element (e.g. a custom link) like a Button. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "href"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, ...rest } = props;
  const classes = buttonClasses(variant, size, className);

  if (props.href !== undefined) {
    const { href, ...anchorRest } = rest as Omit<ButtonAsLink, keyof CommonProps | "className">;
    return <Link href={href} className={classes} {...anchorRest} />;
  }

  const { type = "button", disabled, ...buttonRest } = rest as Omit<
    ButtonAsButton,
    keyof CommonProps | "className"
  >;
  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={disabled ? true : undefined}
      className={classes}
      {...buttonRest}
    />
  );
}
