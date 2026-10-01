import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runScan } from "@/inngest/functions/run-scan";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runScan],
});
