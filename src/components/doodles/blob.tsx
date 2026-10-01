import type { DoodleProps } from "./types";

const BLOB_PATH =
  "M60 8 C82 4 108 18 112 42 C116 64 106 78 108 94 C104 110 80 116 62 112 C42 114 20 108 12 90 C6 72 14 62 10 44 C10 24 36 12 60 8 Z";

type BlobProps = DoodleProps & {
  /** Fill color; defaults to the pink token. */
  fill?: string;
};

/** Organic blob with white scribble lines on top and an ink outline. */
export function ScribbleBlob({ className, style, fill = "var(--pink)", ...rest }: BlobProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d={BLOB_PATH} fill={fill} stroke="var(--ink)" />
      <g stroke="#fff" strokeWidth={3}>
        <path d="M30 40 C42 28 50 34 58 28" />
        <path d="M26 58 C44 44 64 56 84 38" />
        <path d="M24 76 C46 62 70 76 92 56" />
        <path d="M36 92 C54 82 70 92 84 80" />
      </g>
    </svg>
  );
}

/** Red blob with a pattern of white dots. */
export function DottedBlob({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M58 6 C84 6 110 22 110 48 C112 66 100 76 104 92 C104 108 82 116 62 114 C40 116 14 108 10 84 C8 66 18 58 14 42 C14 22 34 6 58 6 Z"
        fill="var(--red)"
        stroke="var(--ink)"
      />
      <g fill="#fff" stroke="none">
        {[
          [34, 34], [56, 28], [78, 36], [96, 52],
          [26, 56], [48, 50], [70, 58], [90, 74],
          [36, 78], [58, 76], [78, 92], [46, 98],
          [24, 94], [64, 100],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 4 : 3} />
        ))}
      </g>
    </svg>
  );
}
