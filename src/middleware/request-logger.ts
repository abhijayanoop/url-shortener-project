import { Request, Response, NextFunction } from "express";
import { getCorrelationId } from "./correlation-id";
import { config } from "../config";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const correlationId = getCorrelationId();

    const logLine = `[${correlationId}] ${method} ${originalUrl} ${statusCode} ${duration}ms`;

    if (statusCode >= 500) {
      console.error(logLine);
    } else if (statusCode >= 400) {
      console.warn(logLine);
    } else {
      if (config.server.isDev) {
        console.log(logLine);
      }
    }
  });

  next();
}
