import mongoose from "mongoose";
import { config } from "../config";

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

      console.log("✅ Connected to MongoDB");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      if (attempt === retries) {
        console.error(
          `❌ Failed to connect to MongoDB after ${retries} attempts: ${message}`,
        );
        throw error;
      }

      console.warn(
        `⚠️  MongoDB connection attempt ${attempt}/${retries} failed: ${message}. ` +
          `Retrying in ${delay / 1000}s...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export function registerConnectionEvents(): void {
  const connection = mongoose.connection;

  connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  connection.on("error", (error: Error) => {
    console.error("MongoDB connection error:", error.message);
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log("Database disconnnected");
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
