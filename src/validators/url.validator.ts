import { z } from "zod";
import {
  isPrivateHost,
  isAllowedProtocol,
  normalizeUrl,
} from "../utils/url-sanitizer";

export const createUrlSchema = z.object({
  longUrl: z
    .string({
      error: "URL is required and must be a string",
    })
    .trim()
    .min(1, "URL cannot be empty")
    .max(2048, "URL is too long (max 2048 characters)")
    .refine(
      (val) => {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Must be a valid URL (include http:// or https://)" },
    )
    .refine(
      (val) => {
        try {
          const url = new URL(val);
          return isAllowedProtocol(url.protocol);
        } catch {
          return false;
        }
      },
      { message: "URL must use HTTP or HTTPS protocol" },
    )
    .refine(
      (val) => {
        try {
          const url = new URL(val);
          return !isPrivateHost(url.hostname);
        } catch {
          return false;
        }
      },
      {
        message:
          "URL must not point to a private or reserved IP address " +
          "(localhost, 10.x.x.x, 192.168.x.x, etc.)",
      },
    )
    .transform((val) => {
      return normalizeUrl(val);
    }),

  customAlias: z
    .string()
    .trim()
    .min(4, "Custom alias must be at least 4 characters")
    .max(20, "Custom alias must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Custom alias can only contain letters, numbers, hyphens, and underscores",
    )
    .optional(),

  expiresAt: z
    .string()
    .datetime({ message: "expiresAt must be a valid ISO 8601 datetime string" })
    .transform((val) => new Date(val))
    .refine((date) => date.getTime() > Date.now(), {
      message: "Expiry date must be in the future",
    })
    .optional(),
});
export type CreateUrlInput = z.infer<typeof createUrlSchema>;

export const updateUrlSchema = z
  .object({
    originalUrl: z
      .string()
      .trim()
      .min(1, "URL cannot be empty")
      .max(2048, "URL is too long")
      .refine(
        (val) => {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Must be a valid URL" },
      )
      .refine(
        (val) => {
          try {
            return isAllowedProtocol(new URL(val).protocol);
          } catch {
            return false;
          }
        },
        { message: "URL must use HTTP or HTTPS protocol" },
      )
      .refine(
        (val) => {
          try {
            return !isPrivateHost(new URL(val).hostname);
          } catch {
            return false;
          }
        },
        { message: "URL must not point to a private IP address" },
      )
      .transform((val) => normalizeUrl(val))
      .optional(),

    expiresAt: z
      .string()
      .datetime({ message: "Must be a valid ISO 8601 datetime" })
      .transform((val) => new Date(val))
      .refine((date) => date.getTime() > Date.now(), {
        message: "Expiry date must be in the future",
      })
      .optional(),
  })
  .refine(
    (data) => data.originalUrl !== undefined || data.expiresAt !== undefined,
    {
      message: "At least one field (originalUrl or expiresAt) must be provided",
      path: ["_root"],
    },
  );

export type UpdateUrlInput = z.infer<typeof updateUrlSchema>;

export const shortCodeParamSchema = z.object({
  code: z
    .string()
    .min(4, "Short code must be at least 4 characters")
    .max(20, "Short code must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Short code can only contain letters, numbers, hyphens, and underscores",
    ),
});

export type ShortCodeParam = z.infer<typeof shortCodeParamSchema>;

export const paginationQuerySchema = z.object({
  cursor: z
    .string()
    .regex(/^[a-f0-9]{24}$/, "Cursor must be a valid MongoDB ObjectId")
    .optional(),

  limit: z
    .string()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int("Limit must be a whole number")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit must be at most 100"),
    ),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
