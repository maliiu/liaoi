import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import messagesRouter from "./routes/messages";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import conversationsRouter from "./routes/conversations";
import adminRouter from "./routes/admin";
import roomsRouter from "./routes/rooms";
import friendsRouter from "./routes/friends";
import mediaRouter from "./routes/media";
import squareRouter from "./routes/square";
import driftRouter from "./routes/drift";
import roomsMembersRouter from "./routes/roomsMembers";
import { logger } from "./logger";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  const allowedOrigins =
    (process.env.PUBLIC_ORIGIN && process.env.PUBLIC_ORIGIN.split(",")) || [
      "http://localhost"
    ];

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins
    })
  );
  app.use(
    pinoHttp({
      logger,
      customSuccessMessage() {
        return "request_completed";
      },
      customErrorMessage() {
        return "request_error";
      }
    })
  );
  app.use(express.json({ limit: "64kb" }));
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use(
    "/uploads",
    express.static(path.resolve(__dirname, "..", "uploads"), {
      maxAge: "7d",
      fallthrough: true
    })
  );
  app.use(
    "/api/messages",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/rooms", roomsRouter);
  app.use("/api/rooms", roomsMembersRouter);
  app.use("/api/friends", friendsRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/square", squareRouter);
  app.use("/api/drift", driftRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "not_found" });
  });
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      logger.error({ err }, "unhandled_error");
      res.status(500).json({ message: "internal_error" });
    }
  );
  return app;
}
