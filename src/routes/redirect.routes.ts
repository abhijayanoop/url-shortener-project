import { Router } from "express";
import { redirectController } from "../controllers/redirect.controller";
import { createRateLimiter } from "../middleware/rate-limiter";
import { config } from "../config";

const router = Router();

const redirectRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: config.rateLimit.redirectMax,
  keyExtractor: (req) => req.ip || req.socket.remoteAddress || "unknown",
});

router.get("/:code", redirectRateLimiter, redirectController);

export default router;
