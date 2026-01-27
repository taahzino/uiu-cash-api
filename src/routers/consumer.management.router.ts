import { Router } from "express";
import {
  getConsumersPaginated,
  getConsumerDetails,
  updateConsumerStatus,
  getConsumerTransactions,
} from "../controllers/consumer.management.controller";
import { authenticateAdmin } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  getConsumersPaginatedSchema,
  getConsumerByIdSchema,
  updateConsumerStatusParamsSchema,
  updateConsumerStatusBodySchema,
  getConsumerTransactionsParamsSchema,
  getConsumerTransactionsQuerySchema,
} from "../validators/consumer.management.validator";

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

router.post(
  "/list",
  validateZodSchema(getConsumersPaginatedSchema, "body"),
  getConsumersPaginated,
);
router.get(
  "/:id",
  validateZodSchema(getConsumerByIdSchema, "params"),
  getConsumerDetails,
);
router.patch(
  "/:id/status",
  validateZodSchema(updateConsumerStatusParamsSchema, "params"),
  validateZodSchema(updateConsumerStatusBodySchema, "body"),
  updateConsumerStatus,
);
router.get(
  "/:id/transactions",
  validateZodSchema(getConsumerTransactionsParamsSchema, "params"),
  validateZodSchema(getConsumerTransactionsQuerySchema, "query"),
  getConsumerTransactions,
);

export default router;
