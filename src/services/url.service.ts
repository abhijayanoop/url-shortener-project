import { config } from "../config";
import { IUrlDocument } from "../models/url.model";
import { UrlRepository } from "../repositories/url.repository";
import { PaginatedResult, PaginationParams } from "../types";
import {
  AppError,
  ConflictError,
  GoneError,
  NotFoundError,
} from "../utils/error";
import { logger } from "../utils/logger";
import { generateShortCode } from "../utils/short-code";

export interface ShortenInput {
  longUrl: string;
  userId: string;
  customAlias?: string;
  expiresAt?: Date;
}

export interface ShortenResult {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

const MAX_COLLISION_RETRIES = 3;

export class UrlService {
  constructor(private urlRepo: UrlRepository) {}

  shorten(input: ShortenInput) {
    const expiresAt = input.expiresAt ?? this.computeDefaultExpiry();

    if (input.customAlias) {
      return this.createWithCustomAlias(input, expiresAt);
    }

    return this.createWithRandomCode(input, expiresAt);
  }

  async createWithCustomAlias(
    input: ShortenInput,
    expiresAt: Date,
  ): Promise<ShortenResult> {
    const result = await this.urlRepo.create({
      shortCode: input.customAlias!,
      url: input.longUrl,
      userId: input.userId,
      expiresAt: expiresAt,
    });

    if (result.type === "duplicate") {
      throw new ConflictError("Url with the custom alias already exists");
    }

    return this.formatResult(result.url);
  }

  async createWithRandomCode(
    input: ShortenInput,
    expiresAt: Date,
  ): Promise<ShortenResult> {
    // let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_COLLISION_RETRIES; attempt++) {
      const shortCode = generateShortCode();

      const result = await this.urlRepo.create({
        shortCode: shortCode,
        url: input.longUrl,
        userId: input.userId,
        expiresAt: expiresAt,
      });

      if (result.type === "success") {
        return this.formatResult(result.url);
      }

      logger.warn(
        { attempt, maxRetries: MAX_COLLISION_RETRIES, shortCode },
        "Short code collision, retrying with new code",
      );

      //   lastError = new Error(`Collision for shortCode: ${shortCode}`);
    }

    throw new AppError(
      "Failed to generate a unique short code after multiple attempts",
      500,
      "SHORT_CODE_GENERATION_FAILED",
      false, // Not operational — this indicates a system issue
    );
  }

  async resolveRedirect(shortCode: string): Promise<IUrlDocument> {
    const url = await this.urlRepo.incrementClicksAndGet(shortCode);

    if (url) {
      if (url.expiresAt < new Date()) {
        throw new GoneError("Url link expired");
      }

      return url;
    }
    throw new NotFoundError("Short link not found");
  }

  async getByShortCode(
    shortCode: string,
    userId: string,
  ): Promise<IUrlDocument> {
    const url = await this.urlRepo.findByShortCode(shortCode);
    if (!url) {
      throw new NotFoundError("Short link not found");
    }

    if (url.userId !== userId) {
      throw new NotFoundError("Url not found");
    }
    return url;
  }

  async update(
    shortCode: string,
    userId: string,
    data: { originalUrl?: string; expiresAt?: Date },
  ): Promise<IUrlDocument> {
    const url = await this.urlRepo.update(shortCode, userId, data);

    if (!url) {
      throw new NotFoundError(
        "URL not found or you don't have permission to update it",
      );
    }

    return url;
  }

  async delete(shortCode: string, userId: string): Promise<IUrlDocument> {
    const url = await this.urlRepo.softDelete(shortCode, userId);

    if (!url) {
      throw new NotFoundError(
        "URL not found or you don't have permission to delete it",
      );
    }

    return url;
  }

  async listByUser(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<IUrlDocument>> {
    return this.urlRepo.findByUserId(userId, pagination);
  }

  /* ----------- PRIVATE HELPERS ------------- */

  private computeDefaultExpiry() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.app.defaultExpiryDays);
    return expiresAt;
  }

  private formatResult(url: IUrlDocument): ShortenResult {
    return {
      shortCode: url.shortCode,
      shortUrl: `${config.app.baseUrl}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt,
      createdAt: url.createdAt,
    };
  }
}
