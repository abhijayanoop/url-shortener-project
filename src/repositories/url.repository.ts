import { IUrlDocument, UrlModel } from "../models/url.model";
import { PaginatedResult, PaginationParams } from "../types";

export type CreateUrlResult =
  | { type: "success"; url: IUrlDocument }
  | { type: "duplicate"; field: string };

export interface CreateUrlData {
  shortCode: string;
  url: string;
  userId: string;
  expiresAt: Date;
}

export class UrlRepository {
  async create(data: CreateUrlData): Promise<CreateUrlResult> {
    try {
      const url = await UrlModel.create(data);
      return { type: "success", url: url };
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        const field = this.getDuplicateField(error);
        return { type: "duplicate", field: field };
      }
      throw error;
    }
  }

  async findByShortCode(shortCode: string): Promise<IUrlDocument | null> {
    return UrlModel.findOne({ shortCode: shortCode }).lean();
  }

  async findActiveByShortCode(shortCode: string): Promise<IUrlDocument | null> {
    return UrlModel.findOne({
      shortCode: shortCode,
      deletedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean();
  }

  async findByUserId(
    userId: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResult<IUrlDocument>> {
    const { cursor, limit } = paginationParams;

    const query: Record<string, unknown> = {
      userId: userId,
      deletedAt: null,
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const result = await UrlModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = result.length > limit;

    const items = hasMore ? result.slice(0, limit) : result;

    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]._id.toString()
        : null;

    return { items: items, nextCursor: nextCursor, hasMore: hasMore };
  }

  async update(
    shortCode: string,
    userId: string,
    data: { originalUrl?: string; expiresAt?: Date },
  ): Promise<IUrlDocument | null> {
    const updatedFields: Record<string, unknown> = {};
    if (data.originalUrl) updatedFields.orginalUrl = data.originalUrl;
    if (data.expiresAt) updatedFields.expiresAt = data.expiresAt;

    if (Object.keys(updatedFields).length === 0) {
      return this.findByShortCode(shortCode);
    }

    const updatedUrl = await UrlModel.findOneAndUpdate(
      { shortCode: shortCode, userId: userId },
      { $set: updatedFields },
      { new: true },
    ).lean();
    return updatedUrl;
  }

  async softDelete(
    shortCode: string,
    userId: string,
  ): Promise<IUrlDocument | null> {
    return UrlModel.findOneAndUpdate(
      { shortCode, userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).lean();
  }

  async incrementClicksAndGet(shortCode: string): Promise<IUrlDocument | null> {
    return UrlModel.findOneAndUpdate(
      { shortCode, deletedAt: null },
      { $inc: { clicks: 1 } },
      { new: true },
    ).lean();
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === 11000
    );
  }

  private getDuplicateField(error: unknown): string {
    if (typeof error === "object" && error !== null && "keyPattern" in error) {
      const keyPattern = (error as { keyPattern: Record<string, unknown> })
        .keyPattern;
      return Object.keys(keyPattern)[0] ?? "unknown";
    }
    return "unknown";
  }
}
