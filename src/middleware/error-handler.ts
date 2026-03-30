import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error";
import { config } from "../config";
import { getCorrelationId } from "./correlation-id";
import { logger } from "../utils/logger";

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = getCorrelationId();

  const isOperational = err instanceof AppError && err.isOperational;

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  const code = err instanceof AppError ? err.code : "INTERNAL_ERROR";

  const message = isOperational
    ? err.message
    : "An unexpected error occurred. Please try again later.";

  const details = err instanceof AppError ? err.details : undefined;

  const logData = {
    err,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
  };

  if (statusCode >= 500) {
    logger.error(logData, "unhandled error");
  } else {
    logger.warn(logData, "client error");
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(config.server.isDev && err.stack && { stack: err.stack }),
      correlationId,
    },
  };

  res.status(statusCode).json(responseBody);
}
