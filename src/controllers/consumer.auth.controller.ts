import { Request, Response } from "express";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import logger from "../config/_logger";
import { Users, UserRole, UserStatus } from "../models/Users.model";
import { Wallets } from "../models/Wallets.model";
import {
  Transactions,
  TransactionType,
  TransactionStatus,
} from "../models/Transactions.model";
import { SystemConfig } from "../models/SystemConfig.model";
import { generateToken } from "../utilities/jwt";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../utilities/password";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_CONFLICT,
  STATUS_CREATED,
  STATUS_FORBIDDEN,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
} from "../utilities/response";

// Import platform wallet simulation
const platformWallet = require(
  path.join(__dirname, "../../simulation/platform_wallet"),
);

/**
 * Consumer Registration Controller
 * POST /api/auth/consumer/register
 */
export const consumerRegister = async (req: Request, res: Response) => {
  try {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      role,
      dateOfBirth,
      nidNumber,
    } = req.body;

    // Check if email already exists
    const existingEmail = await Users.findByEmail(email);
    if (existingEmail) {
      return sendResponse(res, STATUS_CONFLICT, {
        message: "Email already registered",
      });
    }

    // Check if phone already exists
    const existingPhone = await Users.findByPhone(phone);
    if (existingPhone) {
      return sendResponse(res, STATUS_CONFLICT, {
        message: "Phone number already registered",
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Generate public key for JWT validation
    const public_key = uuidv4();

    // Determine user status based on role
    // CONSUMER users are automatically ACTIVE
    // AGENT users need admin approval (PENDING)
    const userStatus =
      role === UserRole.CONSUMER ? UserStatus.ACTIVE : UserStatus.PENDING;

    // Create user
    const newUser = await Users.createUser({
      email,
      phone,
      password_hash,
      public_key,
      first_name: firstName,
      last_name: lastName,
      role,
      date_of_birth: dateOfBirth || null,
      nid_number: nidNumber || null,
      status: userStatus,
    });

    // Create wallet for the user
    const newWallet = await Wallets.createWallet({
      user_id: newUser.id,
    });

    // Give onboarding bonus to CONSUMER users only
    let bonusGiven = false;
    if (role === UserRole.CONSUMER) {
      try {
        // Get onboarding bonus amount from system config
        const bonusConfig = await SystemConfig.findByKey("onboarding_bonus");
        const bonusAmount = bonusConfig
          ? parseFloat(bonusConfig.config_value)
          : 50.0;

        // Check if platform has sufficient balance
        if (platformWallet.hasSufficientBalance(bonusAmount)) {
          // Deduct from platform wallet
          platformWallet.deductBalance(bonusAmount, "Onboarding Bonus");

          // Credit to user wallet
          const updatedBalance =
            parseFloat(newWallet.balance.toString()) + bonusAmount;
          await Wallets.updateBalance(
            newWallet.id,
            updatedBalance,
            updatedBalance,
          );

          // Create transaction record
          await Transactions.createTransaction({
            type: TransactionType.ONBOARDING_BONUS,
            receiver_id: newUser.id,
            receiver_wallet_id: newWallet.id,
            amount: bonusAmount,
            fee: 0,
            description: "Welcome bonus for new user registration",
            metadata: {
              source: "platform_wallet",
              bonus_type: "onboarding",
            },
          });

          // Update transaction status to completed
          const transaction = await Transactions.findOne({
            receiver_id: newUser.id,
            type: TransactionType.ONBOARDING_BONUS,
          });
          if (transaction) {
            await Transactions.updateById(transaction.id, {
              status: TransactionStatus.COMPLETED,
              completed_at: new Date(),
            });
          }

          bonusGiven = true;
          logger.info(
            `Onboarding bonus of ৳${bonusAmount} given to user ${newUser.id}`,
          );
        } else {
          logger.warn(
            `Platform wallet has insufficient balance to give onboarding bonus to user ${newUser.id}`,
          );
        }
      } catch (bonusError: any) {
        logger.error(`Failed to give onboarding bonus: ${bonusError.message}`);
        // Continue registration even if bonus fails
      }
    }

    logger.info(
      `Consumer registered: ${newUser.id} (${email}) - Status: ${userStatus}${bonusGiven ? " - Bonus: ৳50" : ""}`,
    );

    const message =
      role === UserRole.CONSUMER
        ? bonusGiven
          ? "Registration successful! You've received ৳50 welcome bonus. You can now log in."
          : "Registration successful. You can now log in."
        : "Registration successful. Your agent account is pending admin approval.";

    return sendResponse(res, STATUS_CREATED, {
      message,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          phone: newUser.phone,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          status: newUser.status,
        },
        bonusGiven: bonusGiven,
      },
    });
  } catch (error: any) {
    logger.error("User registration error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during registration",
    });
  }
};

/**
 * Consumer Login Controller
 * POST /api/auth/consumer/login
 */
export const consumerLogin = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or phone
    const user = await Users.findByEmailOrPhone(identifier);
    if (!user) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Invalid credentials",
      });
    }

    // Check account status
    if (user.status === UserStatus.SUSPENDED) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Account is suspended. Please contact support.",
      });
    }

    if (user.status === UserStatus.REJECTED) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Account registration was rejected.",
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user.id, user.public_key, "Consumer");

    // Update login info
    await Users.updateLoginInfo(user.id);

    // Get wallet balance
    const wallet = await Wallets.findByUserId(user.id);

    logger.info(`User logged in: ${user.id} (${user.email})`);

    return sendResponse(res, STATUS_OK, {
      message: "Login successful",
      data: {
        token,
        profile: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          dateOfBirth: user.date_of_birth,
          nidNumber: user.nid_number,
          createdAt: user.created_at,
          wallet: wallet
            ? {
                balance: wallet.balance,
                availableBalance: wallet.available_balance,
                pendingBalance: wallet.pending_balance,
                currency: wallet.currency,
                dailyLimit: wallet.daily_limit,
                monthlyLimit: wallet.monthly_limit,
                dailySpent: wallet.daily_spent,
                monthlySpent: wallet.monthly_spent,
              }
            : null,
        },
        userType: "Consumer",
      },
    });
  } catch (error: any) {
    logger.error("User login error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during login",
    });
  }
};

/**
 * Consumer Logout Controller
 * POST /api/auth/consumer/logout
 * Regenerates the public_key to invalidate all existing tokens
 */
export const consumerLogout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    // Generate new public key to invalidate all existing tokens
    const new_public_key = uuidv4();

    // Update user's public key
    await Users.updateUser(userId, { public_key: new_public_key });

    logger.info(`User logged out: ${userId} - All tokens invalidated`);

    return sendResponse(res, STATUS_OK, {
      message: "Logout successful. All sessions have been terminated.",
    });
  } catch (error: any) {
    logger.error("User logout error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during logout",
    });
  }
};

/**
 * Get Current Consumer Profile
 * GET /api/auth/consumer/profile
 */
export const getConsumerProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User not found",
      });
    }

    // Get wallet
    const wallet = await Wallets.findByUserId(userId);

    return sendResponse(res, STATUS_OK, {
      message: "Profile retrieved successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          dateOfBirth: user.date_of_birth,
          nidNumber: user.nid_number,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          createdAt: user.created_at,
          wallet: wallet
            ? {
                balance: wallet.balance,
                availableBalance: wallet.available_balance,
                pendingBalance: wallet.pending_balance,
                currency: wallet.currency,
                dailyLimit: wallet.daily_limit,
                monthlyLimit: wallet.monthly_limit,
                dailySpent: wallet.daily_spent,
                monthlySpent: wallet.monthly_spent,
              }
            : null,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get user profile error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching profile",
    });
  }
};

/**
 * Update Consumer Profile
 * PUT /api/auth/consumer/profile
 */
export const updateConsumerProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, dateOfBirth } = req.body;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const updateData: any = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (dateOfBirth) updateData.date_of_birth = dateOfBirth;

    const updatedUser = await Users.updateUser(userId, updateData);

    if (!updatedUser) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User not found",
      });
    }

    return sendResponse(res, STATUS_OK, {
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          dateOfBirth: updatedUser.date_of_birth,
        },
      },
    });
  } catch (error: any) {
    logger.error("Update user profile error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while updating profile",
    });
  }
};

/**
 * Change Password
 * PUT /api/auth/consumer/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "New password does not meet requirements",
        errors: passwordValidation.errors.map((error) => ({
          field: "newPassword",
          message: error,
        })),
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(
      currentPassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    await Users.updateUser(userId, { password_hash });

    logger.info(`User changed password: ${userId}`);

    return sendResponse(res, STATUS_OK, {
      message: "Password changed successfully",
    });
  } catch (error: any) {
    logger.error("Change password error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while changing password",
    });
  }
};
