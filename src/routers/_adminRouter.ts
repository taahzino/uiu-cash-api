import { Router } from "express";
import consumerManagementRouter from "./consumer.management.router";
import agentManagementRouter from "./agent.management.router";
import analyticsRouter from "./analytics.router";

const adminRouter = Router();

// Consumer management routes
adminRouter.use("/consumers", consumerManagementRouter);

// Agent management routes
adminRouter.use("/agents", agentManagementRouter);

// Analytics routes
adminRouter.use("/analytics", analyticsRouter);

export default adminRouter;
