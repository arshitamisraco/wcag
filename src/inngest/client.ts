import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "ai-a11y-auditor" });

export type ScanRequestedData = { scanId: string };
