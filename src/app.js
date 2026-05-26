import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import partneriRoutes from "./routes/partneri.routes.js";
import artikliRoutes from "./routes/artikli.routes.js";
import racunRoutes from "./routes/racun.routes.js";
import blagajnaRoutes from "./routes/blagajna.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/partneri", partneriRoutes);
  app.use("/api/artikli", artikliRoutes);
  app.use("/api/racun", racunRoutes);
  app.use("/api/blagajna", blagajnaRoutes);

  if (env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "../dist");
    app.use("/prodaja", express.static(distPath));
    app.get("/prodaja", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.get("/prodaja/*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
};
