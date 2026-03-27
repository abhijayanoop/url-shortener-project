import { analyticsService } from "../services";
import { asyncHandler } from "../utils/async-handler";
import type { Request, Response } from "express";

export const analyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const code = req.params.code as string;
    const userId = (req as any).userId ?? "anonymous";

    const response = await analyticsService.getAnalytics(code, userId);

    res.status(200).json({ success: true, data: response });
  },
);
