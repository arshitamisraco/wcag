import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const scanStatus = pgEnum("scan_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const aiStatus = pgEnum("ai_status", [
  "pending",
  "done",
  "failed",
  "skipped",
]);

export type ImpactCounts = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

export type ScanSummary = {
  violations: number;
  passes: number;
  incomplete: number;
  inapplicable: number;
  byImpact: ImpactCounts;
};

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull().unique(),
  hostname: text("hostname").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const scans = pgTable(
  "scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    status: scanStatus("status").notNull().default("queued"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    error: text("error"),
    summary: jsonb("summary").$type<ScanSummary>(),
  },
  (t) => [index("scans_site_id_idx").on(t.siteId), index("scans_created_at_idx").on(t.createdAt)],
);

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(),
    impact: text("impact"),
    description: text("description").notNull(),
    help: text("help").notNull(),
    helpUrl: text("help_url").notNull(),
    wcagTags: text("wcag_tags").array().notNull().default([]),
    selector: text("selector").notNull(),
    html: text("html").notNull(),
    failureSummary: text("failure_summary"),
    aiExplanation: text("ai_explanation"),
    aiFixCode: text("ai_fix_code"),
    aiFixSummary: text("ai_fix_summary"),
    aiStatus: aiStatus("ai_status").notNull().default("pending"),
  },
  (t) => [index("issues_scan_id_idx").on(t.scanId)],
);

export type Site = typeof sites.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type ScanStatus = Scan["status"];
export type AiStatus = Issue["aiStatus"];
