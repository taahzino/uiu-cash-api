import { Router } from "express";
import consumerManagementRouter from "./consumer.management.router";
import agentManagementRouter from "./agent.management.router";
import analyticsRouter from "./analytics.router";
import billerManagementRouter from "./biller.management.router";
import platformWalletRouter from "./platform.wallet.router";

const adminRouter = Router();

// Consumer management routes
adminRouter.use("/consumers", consumerManagementRouter);

// Agent management routes
adminRouter.use("/agents", agentManagementRouter);

// Analytics routes
adminRouter.use("/analytics", analyticsRouter);

// Biller management routes
adminRouter.use("/billers", billerManagementRouter);

// Platform wallet routes
adminRouter.use("/platform-wallet", platformWalletRouter);

export default adminRouter;
