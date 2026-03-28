import { Router } from "express";
import { validate } from "../../middleware/validate";
import {
  createUrlSchema,
  updateUrlSchema,
  paginationQuerySchema,
  shortCodeParamSchema,
} from "../../validators/url.validator";
import {
  shortenController,
  listUrlsController,
  updateUrlController,
  deleteUrlController,
} from "../../controllers/url.controller";
import { analyticsController } from "../../controllers/analytics.controller";
import { createRateLimiter } from "../../middleware/rate-limiter";
import { config } from "../../config";

const router = Router();

const shortenRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: config.rateLimit.shortenMax,
  keyExtractor: (req) => (req as any).userId ?? "anonymous",
});

/**
 * POST /v1/shorten
 */
router.post(
  "/shorten",
  shortenRateLimiter,
  validate({ body: createUrlSchema }),
  shortenController,
);

/**
 * GET /v1/urls
 */
router.get(
  "/urls",
  validate({ query: paginationQuerySchema }),
  listUrlsController,
);

/**
 * GET /v1/urls/:code/analytics
 */
router.get(
  "/urls/:code/analytics",
  validate({ params: shortCodeParamSchema }),
  analyticsController,
);

/**
 * PATCH /v1/urls/:code
 */
router.patch(
  "/urls/:code",
  validate({ params: shortCodeParamSchema, body: updateUrlSchema }),
  updateUrlController,
);

/**
 * DELETE /v1/urls/:code
 */
router.delete(
  "/urls/:code",
  validate({ params: shortCodeParamSchema }),
  deleteUrlController,
);

export default router;
