import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth";

const uploadDir = path.join(process.cwd(), "uploads", "voice");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const router = Router();

router.post("/upload", authenticate, upload.single("file"), (req, res) => {
  const file = (req as any).file as any;
  if (!file) {
    return res.status(400).json({ message: "file_required" });
  }
  const mediaUrl = `/uploads/voice/${file.filename}`;
  res.json({ mediaUrl });
});

export default router;
