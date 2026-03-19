import express, { Express } from "express";
import { correlationIdMiddleware } from "./middleware/correlation-id";
import helmet from "helmet";
import cors from "cors";
import { config } from "./config";
import { requestLoggerMiddleware } from "./middleware/request-logger";
import { notFoundHandler } from "./middleware/not-found-handler";
import { globalErrorHandler } from "./middleware/error-handler";

export function createApp(): Express {
  const app = express();

  app.use(correlationIdMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: config.server.isDev ? "*" : config.app.baseUrl,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
        "X-Correlation-ID",
      ],
      exposedHeaders: [
        "X-Correlation-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ],
      maxAge: 86400,
    }),
  );

  app.use(express.json({ limit: "10kb" }));

  app.use(requestLoggerMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      data: { status: "ok" },
    });
  });

  app.use(notFoundHandler);

  app.use(globalErrorHandler);

  return app;
}
