import type { CSSProperties, SVGProps } from "react";

/** Props shared by every decorative doodle. `aria-hidden` and `focusable` are fixed. */
export type DoodleProps = Omit<SVGProps<SVGSVGElement>, "aria-hidden" | "focusable"> & {
  className?: string;
  style?: CSSProperties;
};
