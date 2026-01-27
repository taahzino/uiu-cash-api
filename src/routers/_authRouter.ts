import { Router } from "express";
import adminAuthRouter from "./admin.auth.router";
import consumerAuthRouter from "./consumer.auth.router";
import agentAuthRouter from "./agent.auth.router";

const authRouter = Router();

// Consumer authentication routes
authRouter.use("/consumer", consumerAuthRouter);

// Agent authentication routes
authRouter.use("/agent", agentAuthRouter);

// Admin authentication routes
authRouter.use("/admin", adminAuthRouter);

export default authRouter;
