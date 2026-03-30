import { createApp } from "./app";
import { config } from "./config";
import {
  connectDatabase,
  registerConnectionEvents,
  disconnectDatabase,
} from "./database/connection";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  try {
    registerConnectionEvents();

    await connectDatabase();

    const app = createApp();

    const server = app.listen(config.server.port, () => {
      logger.info(
        { port: config.server.port, env: config.server.env },
        "Server started",
      );
    });

    const shutdown = async (signal: string) => {
      logger.info({ signal }, "Shutdown signal received");

      server.close(async () => {
        logger.info("HTTP server closed.");

        try {
          await disconnectDatabase();
        } catch (error) {
          logger.error({ err: error }, "Error disconnecting from MongoDB");
        }

        process.exit(0);
      });

      setTimeout(() => {
        logger.fatal("Forced shutdown — timeout exceeded");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start application");
    process.exit(1);
  }
}

main();
