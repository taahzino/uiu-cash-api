import { Router } from "express";
import {
  getAllConsumers,
  getConsumerDetails,
  updateConsumerStatus,
  searchConsumers,
  getConsumerTransactions,
} from "../controllers/consumer.management.controller";
import { authenticateAdmin } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  getConsumersSchema,
  getConsumerByIdSchema,
  updateConsumerStatusParamsSchema,
  updateConsumerStatusBodySchema,
  searchConsumersSchema,
  getConsumerTransactionsParamsSchema,
  getConsumerTransactionsQuerySchema,
} from "../validators/consumer.management.validator";

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

router.get(
  "/",
  validateZodSchema(getConsumersSchema, "query"),
  getAllConsumers,
);
router.get(
  "/search",
  validateZodSchema(searchConsumersSchema, "query"),
  searchConsumers,
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
