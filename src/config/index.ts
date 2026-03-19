import dotenv from "dotenv";
import { z } from "zod";

// ─────────────────────────────────────────────────────────
// 1. Load environment variables from .env file
// ─────────────────────────────────────────────────────────
dotenv.config();

// ─────────────────────────────────────────────────────────
// 2. Define the schema for raw environment variables
// ─────────────────────────────────────────────────────────
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535)),

  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI cannot be empty")
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      {
        message: "MONGODB_URI must start with mongodb:// or mongodb+srv://",
      },
    ),

  BASE_URL: z
    .string()
    .trim()
    .min(1, "BASE_URL cannot be empty")
    .url("BASE_URL must be a valid URL")
    .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
      message: "BASE_URL must use http or https protocol",
    })
    .transform((val) => val.replace(/\/+$/, "")),

  DEFAULT_EXPIRY_DAYS: z
    .string()
    .default("30")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(365)),

  RATE_LIMIT_REDIRECT_MAX: z
    .string()
    .default("100")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),

  RATE_LIMIT_SHORTEN_MAX: z
    .string()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
});

// ─────────────────────────────────────────────────────────
// 3. Parse, validate, and structure the config
// ─────────────────────────────────────────────────────────
function loadConfig() {
  try {
    const env = envSchema.parse(process.env);

    return {
      server: {
        port: env.PORT,
        env: env.NODE_ENV,
        isDev: env.NODE_ENV === "development",
        isProd: env.NODE_ENV === "production",
        isTest: env.NODE_ENV === "test",
      },
      mongodb: {
        uri: env.MONGODB_URI,
      },
      app: {
        baseUrl: env.BASE_URL,
        defaultExpiryDays: env.DEFAULT_EXPIRY_DAYS,
      },
      rateLimit: {
        redirectMax: env.RATE_LIMIT_REDIRECT_MAX,
        shortenMax: env.RATE_LIMIT_SHORTEN_MAX,
      },
    } as const;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const details = error.issues
        .map((issue) => {
          const path = issue.path.join(".");
          return `  ✗ ${path}: ${issue.message}`;
        })
        .join("\n");

      console.error(
        `\n❌ Config validation failed:\n\n${details}\n\n` +
          `Check your .env file or environment variables.\n` +
          `See .env.example for required variables.\n`,
      );
    } else if (error instanceof Error) {
      console.error(`\n❌ Failed to load config: ${error.message}\n`);
    } else {
      console.error("\n❌ Failed to load config: Unknown error\n");
    }

    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────
// 4. Export the validated config and its type
// ─────────────────────────────────────────────────────────
export const config = loadConfig();
export type Config = ReturnType<typeof loadConfig>;
