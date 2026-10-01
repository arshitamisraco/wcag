import type { NextConfig } from "next";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const posthogAssetsHost = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core", "axe-core"],
  // The sparticuz package reads its brotli binaries via relative paths at runtime,
  // so file tracing cannot see them. Include them explicitly for the scan route.
  outputFileTracingIncludes: {
    "/api/inngest": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  // PostHog reverse proxy (avoids ad blockers).
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${posthogAssetsHost}/static/:path*` },
      { source: "/ingest/array/:path*", destination: `${posthogAssetsHost}/array/:path*` },
      { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
