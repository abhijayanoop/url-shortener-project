const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAM_EXACT = [
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "ref",
  "_ga",
  "_gl",
];

export function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  if (lower === "localhost" || lower === "") {
    return true;
  }

  // ── IPv6 loopback ──
  if (lower === "::1" || lower === "[::1]") {
    return true;
  }

  // ── IPv4 checks ──.
  const parts = lower.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    const octets = parts.map((p) => parseInt(p, 10));

    if (octets.some((o) => o < 0 || o > 255)) {
      return true;
    }

    const [a, b] = octets;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  return false;
}

/**
 * Remove tracking query parameters from a URL.
 * @param urlString — A valid URL string
 * @returns The URL with tracking parameters removed
 */
export function stripTrackingParams(urlString: string): string {
  try {
    const url = new URL(urlString);
    const paramsToDelete: string[] = [];

    url.searchParams.forEach((_value, key) => {
      const lowerKey = key.toLowerCase();

      const matchesPrefix = TRACKING_PARAM_PREFIXES.some((prefix) =>
        lowerKey.startsWith(prefix),
      );

      const matchesExact = TRACKING_PARAM_EXACT.includes(lowerKey);

      if (matchesPrefix || matchesExact) {
        paramsToDelete.push(key);
      }
    });

    for (const param of paramsToDelete) {
      url.searchParams.delete(param);
    }

    return url.toString();
  } catch {
    return urlString;
  }
}

export function normalizeUrl(urlString: string): string {
  const trimmed = urlString.trim();
  const url = new URL(trimmed);

  const stripped = stripTrackingParams(url.toString());

  const final = new URL(stripped);
  if (final.pathname !== "/" && final.pathname.endsWith("/")) {
    final.pathname = final.pathname.replace(/\/+$/, "");
  }

  return final.toString();
}

export function isAllowedProtocol(protocol: string): boolean {
  return protocol === "http:" || protocol === "https:";
}
