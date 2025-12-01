import pino from "pino";

export const logger = pino({
  name: "gateway",
  level: process.env.LOG_LEVEL ?? "info"
});
