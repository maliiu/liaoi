import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { env } from "../env";
import { pool } from "../lib/db";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as any;
    const username = payload?.sub as string | undefined;
    if (!username) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const [rows] = await pool.query<any[]>(
      "SELECT banned_until FROM users WHERE username=? LIMIT 1",
      [username]
    );
    const bannedUntil = rows[0]?.banned_until as Date | null;
    if (bannedUntil && new Date(bannedUntil).getTime() > Date.now()) {
      return res.status(403).json({ message: "banned", until: bannedUntil });
    }
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "unauthorized" });
  }
}
