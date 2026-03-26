import { createHash } from "node:crypto";
import { clickRepository, urlService } from "../services";
import { asyncHandler } from "../utils/async-handler";
import type { Request, Response } from "express";

const SHORT_CODE_PATTERN = /^[a-zA-Z0-9_-]{4,20}$/;

export const redirectController = asyncHandler(
  async (req: Request, res: Response) => {
    const code = req.params.code as string;

    if (!SHORT_CODE_PATTERN.test(code)) {
      res.status(404).json({ error: "Short link not found" });
      return;
    }

    const url = await urlService.resolveRedirect(code);

    recordClick(code, req).catch((error) => {
      console.log(`Failed to record click:`, error);
    });

    res.redirect(302, url.originalUrl);
  },
);

async function recordClick(shortCode: string, req: Request): Promise<void> {
  /**
   * Hash the IP address for privacy.
   *
   * SHA-256 with a salt means:
   * 1. We can count unique visitors (same IP → same hash)
   * 2. We don't store raw IPs (GDPR/CCPA compliance)
   * 3. The hash isn't reversible (can't derive IP from hash)
   *
   * WHY a salt?
   * Without salt, an attacker could compute a rainbow table of all
   * ~4 billion IPv4 addresses and reverse the hashes. The salt
   * makes this infeasible.
   *
   * In production, the salt should come from config (env variable)
   * and be rotated periodically for additional privacy.
   */
  const ipRaw = req.ip || req.socket.remoteAddress || "unknown";
  const hashedIp = createHash("sha256")
    .update(ipRaw + "_url_shortener_salt")
    .digest("hex");

  /**
   * Extract referrer and user agent.
   *
   * Note: the HTTP header is "Referer" (a historical typo in the
   * HTTP spec that's now permanent). Express lowercases it.
   *
   * Either can be undefined — direct visits have no Referer,
   * some privacy tools strip User-Agent.
   */
  const referrer = (req.headers["referer"] as string) || null;
  const userAgent = (req.headers["user-agent"] as string) || null;

  await clickRepository.create({
    shortCode,
    timestamp: new Date(),
    hashedIp,
    referrer,
    userAgent,
  });
}
