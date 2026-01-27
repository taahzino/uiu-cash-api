import { Router } from "express";
import {
  getDashboardAnalytics,
  getTransactionAnalytics,
  getUserAnalytics,
  getAgentAnalytics,
  getRevenueAnalytics,
} from "../controllers/analytics.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

router.get("/dashboard", getDashboardAnalytics);
router.get("/transactions", getTransactionAnalytics);
router.get("/users", getUserAnalytics);
router.get("/agents", getAgentAnalytics);
router.get("/revenue", getRevenueAnalytics);

export default router;
