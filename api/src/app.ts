import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import authRoutes from "./routes/auth.routes";
import leadRoutes from "./routes/lead.routes";
import wordpressRoutes from "./routes/wordpress.routes";

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, process.env.ANGULAR_URL]
  .flatMap((value) => (value || "").split(","))
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

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/integrations/wordpress", wordpressRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled request error:", error);
  if (error.message === "CORS origin is not allowed") {
    res.status(403).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "Internal server error." });
});

export default app;
