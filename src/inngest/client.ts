import { Inngest } from "inngest";

// The Vercel Inngest integration may store keys with a project-name prefix
// (e.g. wcag_INNGEST_EVENT_KEY); the SDK only reads the unprefixed names.
const prefixed = (name: string) =>
  process.env[name] ||
  Object.entries(process.env).find(([k]) => k.endsWith(`_${name}`))?.[1];

const signingKey = prefixed("INNGEST_SIGNING_KEY");

export const inngest = new Inngest({
  id: "ai-a11y-auditor",
  eventKey: prefixed("INNGEST_EVENT_KEY"),
  signingKey,
});

export type ScanRequestedData = { scanId: string };
