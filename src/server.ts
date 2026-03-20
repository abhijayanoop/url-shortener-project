import { createApp } from "./app";
import { config } from "./config";
import {
  connectDatabase,
  registerConnectionEvents,
  disconnectDatabase,
} from "./database/connection";

async function main(): Promise<void> {
  try {
    registerConnectionEvents();

    await connectDatabase();

    const app = createApp();

    const server = app.listen(config.server.port, () => {
      console.log(
        `Server running on port ${config.server.port} in ${config.server.env} mode`,
      );
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("HTTP server closed.");

        try {
          await disconnectDatabase();
        } catch (error) {
          console.error("Error disconnecting from MongoDB:", error);
        }

        process.exit(0);
      });

      setTimeout(() => {
        console.error("Forced shutdown — timeout exceeded.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

main();
