import { idempotencyService, urlService } from "../services";
import { CreateUrlInput } from "../types";
import { asyncHandler } from "../utils/async-handler";
import type { Request, Response } from "express";
import { PaginationQuery } from "../validators/url.validator";
import { logger } from "../utils/logger";

export const shortenController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateUrlInput;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    if (idempotencyKey) {
      const existingResponse =
        await idempotencyService.checkExisting(idempotencyKey);

      if (existingResponse) {
        res.status(200).json(existingResponse);
        return;
      }
    }

    const userId = (req as any).userId ?? "anonymous";

    const result = await urlService.shorten({
      longUrl: body.longUrl,
      userId,
      expiresAt: body.expiresAt,
      customAlias: body.customAlias,
    });

    const responseBody = { success: true, data: result };

    if (idempotencyKey) {
      try {
        await idempotencyService.storeResponse(idempotencyKey, responseBody);
      } catch (error) {
        logger.error(
          { err: error, idempotencyKey },
          "Failed to store idempotency key",
        );
      }
    }

    res.status(201).setHeader("location", result.shortUrl).json(responseBody);
  },
);

export const listUrlsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).userId ?? "anonymous";
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const result = await urlService.listByUser(userId, { cursor, limit });

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit,
      },
    });
  },
);

export const updateUrlController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).userId ?? "anonymous";
    const { code } = req.params;

    const result = await urlService.update(code.toString(), userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const deleteUrlController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code } = req.params;
    const userId = (req as any).userId ?? "anonymous";

    const result = await urlService.delete(code.toString(), userId);

    res.status(200).json({
      success: true,
      data: {
        shortCode: result.shortCode,
        deletedAt: result.deletedAt,
      },
    });
  },
);
