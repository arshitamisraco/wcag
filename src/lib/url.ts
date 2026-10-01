import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class InvalidUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUrlError";
  }
}

export function privateUrlsAllowed(): boolean {
  return process.env.ALLOW_PRIVATE_URLS === "1";
}

/** Add https:// if missing, strip hash, lowercase hostname. Throws InvalidUrlError. */
export function normalizeUrl(input: string): string {
  let raw = input.trim();
  if (!raw) throw new InvalidUrlError("URL is required");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new InvalidUrlError(`Invalid URL: ${input}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new InvalidUrlError("Only http and https URLs are supported");
  }
  if (!u.hostname) throw new InvalidUrlError("URL must include a hostname");
  u.hostname = u.hostname.toLowerCase();
  u.hash = "";
  return u.toString();
}

export function isPrivateIp(ip: string): boolean {
  const v = ip.replace(/^\[|\]$/g, "").toLowerCase();
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  if (isIP(v) === 4) {
    const [a, b] = v.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (isIP(v) === 6) {
    return (
      v === "::" ||
      v === "::1" ||
      v.startsWith("fc") ||
      v.startsWith("fd") ||
      /^fe[89ab]/.test(v)
    );
  }
  return false;
}

export function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  return isPrivateIp(h);
}

/**
 * Validates a URL for scanning. Rejects non-http(s) and localhost / private
 * addresses (including hostnames resolving to them) unless ALLOW_PRIVATE_URLS=1.
 */
export async function assertScannableUrl(url: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new InvalidUrlError(`Invalid URL: ${url}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new InvalidUrlError("Only http and https URLs are supported");
  }
  if (privateUrlsAllowed()) return u;
  if (isPrivateHostname(u.hostname)) {
    throw new InvalidUrlError("Private or local addresses cannot be scanned");
  }
  if (isIP(u.hostname.replace(/^\[|\]$/g, "")) === 0) {
    try {
      const addrs = await lookup(u.hostname, { all: true });
      if (addrs.some((a) => isPrivateIp(a.address))) {
        throw new InvalidUrlError(
          "Hostname resolves to a private address and cannot be scanned",
        );
      }
    } catch (e) {
      if (e instanceof InvalidUrlError) throw e;
      throw new InvalidUrlError(`Could not resolve hostname: ${u.hostname}`);
    }
  }
  return u;
}
