import { Router } from "express";
import {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  searchUsers,
  getUserTransactions,
} from "../controllers/user.management.controller";
import { adminAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/app/validateRequest";
import {
  getUsersSchema,
  getUserByIdSchema,
  updateUserStatusSchema,
  searchUsersSchema,
  getUserTransactionsSchema,
} from "../validators/user.management.validator";

const router = Router();

// All routes require admin authentication
router.use(adminAuth);

router.get("/", validateRequest(getUsersSchema), getAllUsers);
router.get("/search", validateRequest(searchUsersSchema), searchUsers);
router.get("/:id", validateRequest(getUserByIdSchema), getUserDetails);
router.put(
  "/:id/status",
  validateRequest(updateUserStatusSchema),
  updateUserStatus
);
router.get(
  "/:id/transactions",
  validateRequest(getUserTransactionsSchema),
  getUserTransactions
);

export default router;
