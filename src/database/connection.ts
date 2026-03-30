import mongoose from "mongoose";
import { config } from "../config";
import { logger } from "../utils/logger";

export async function connectDatabase(
  retries = 5,
  delay = 5000,
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(config.mongodb.uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      logger.info("Connected to MongoDB");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      if (attempt === retries) {
        logger.fatal(
          { attempt, maxRetries: retries, error: message },
          "Failed to connect to MongoDB — all retries exhausted",
        );
        throw error;
      }

      logger.warn(
        { attempt, maxRetries: retries, error: message, retryInMs: delay },
        "MongoDB connection failed, retrying",
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export function registerConnectionEvents(): void {
  const connection = mongoose.connection;

  connection.on("connected", () => {
    logger.info("MongoDB connected");
  });

  connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });

  connection.on("error", (error: Error) => {
    logger.error({ err: error }, "MongoDB connection error");
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("Database disconnected");
}

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    await mongoose.connection.db!.admin().ping();
    return true;
  } catch {
    return false;
  }
}
