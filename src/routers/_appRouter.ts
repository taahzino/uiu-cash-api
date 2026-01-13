import express, { NextFunction, Request, Response, Router } from "express";
import _globals from "../config/_globals";
import adminAuthRouter from "./admin.auth.router";
import userAuthRouter from "./user.auth.router";
import userManagementRouter from "./user.management.router";
import systemConfigRouter from "./system.config.router";
import analyticsRouter from "./analytics.router";

const appRouter = Router();

appRouter.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "UIU Cash API - v1.0.0",
  });
  return;
});

// User authentication routes
appRouter.use("/api/auth", userAuthRouter);

// System configuration routes
appRouter.use("/api/config", systemConfigRouter);

// Admin routes
appRouter.use("/api/admin", adminAuthRouter);
appRouter.use("/api/admin/users", userManagementRouter);
appRouter.use("/api/admin/analytics", analyticsRouter);

appRouter.use("/public", express.static(_globals.PUBLIC_DIR));

// Catch 404 and forward to error handler
appRouter.use((req: Request, res: Response) => {
  res.status(404).json({ message: "404 Not Found" });
  return;
});

// Internal Server Error Handler
appRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: "Internal Server Error",
  });
  return;
});

export default appRouter;
