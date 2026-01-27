import express, { NextFunction, Request, Response, Router } from "express";
import _globals from "../config/_globals";
import authRouter from "./_authRouter";
import adminRouter from "./_adminRouter";
import systemConfigRouter from "./system.config.router";
import transactionRouter from "./transaction.router";
import cashoutRouter from "./cashout.router";

const appRouter = Router();

appRouter.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "UIU Cash API - v1.0.0",
  });
  return;
});

// Authentication routes
appRouter.use("/api/auth", authRouter);

// Admin routes
appRouter.use("/api/admin", adminRouter);

// Transaction routes
appRouter.use("/api/transactions", transactionRouter);

// System configuration routes
appRouter.use("/api/config", systemConfigRouter);

// Cash out routes
appRouter.use("/api/cash-out", cashoutRouter);

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
