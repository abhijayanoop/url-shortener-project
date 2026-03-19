import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";

export interface RequestContext {
  correlationId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string {
  return requestContext.getStore()?.correlationId ?? "unknown";
}

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const correlationId =
    (req.headers["x-correlation-id"] as string) || randomUUID();

  res.setHeader("X-Correlation-ID", correlationId);

  requestContext.run({ correlationId }, () => {
    next();
  });
}
