import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration,
    };

    if (statusCode >= 500) {
      logger.error(logData, "request completed");
    } else if (statusCode >= 400) {
      logger.warn(logData, "request completed");
    } else {
      logger.info(logData, "request completed");
    }
  });

  next();
}
