import pino from "pino";
import { config } from "../config";
import { getCorrelationId } from "../middleware/correlation-id";

export const logger = pino({
  level: config.server.isTest
    ? "silent"
    : config.server.isDev
      ? "debug"
      : "info",

  mixin() {
    return { correlationId: getCorrelationId() };
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  ...(config.server.isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});
