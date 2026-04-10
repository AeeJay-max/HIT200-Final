import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import adminRoutes from "./routes/admin.routes";
import citizenRoutes from "./routes/citizen.routes";
import issueRoutes from "./routes/issue.routes";

import compression from "compression";

const app = express();

app.use(compression());

app.use(helmet({
  xssFilter: true,
  noSniff: true,
  frameguard: true,
}));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


import workerRoutes from "./routes/worker.routes";
import analyticsRoutes from "./routes/analytics.routes";
import voteRoutes from "./routes/vote.routes";
import systemRoutes from "./routes/system.routes";
import authRoutes from "./routes/auth.routes";

// routes declaration

app.use("/api/v1", citizenRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", issueRoutes);
app.use("/api/v1", workerRoutes);
app.use("/api/v1", analyticsRoutes);
app.use("/api/v1", voteRoutes);
app.use("/api/v1", systemRoutes);
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});
app.get('/', (req, res) => {
  res.send('Civic Issue Reporter Backend is Running');
});


export default app;
