import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed"));
    },
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "LeadFlow API is healthy" });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled request error:", error);
  res.status(400).json({ message: error.message || "Invalid request" });
});

export default app;
