import { Request, Response } from "express";
import logger from "../config/_logger";
import { Users, UserRole, UserStatus } from "../models/Users.model";
import { Wallets } from "../models/Wallets.model";
import { Agents } from "../models/Agents.model";
import { generateUserToken } from "../utilities/jwt";
import { hashPassword, verifyPassword } from "../utilities/password";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_CONFLICT,
  STATUS_CREATED,
  STATUS_FORBIDDEN,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
} from "../utilities/response";

/**
 * Agent Registration Controller
 * POST /api/agents/auth/register
 */
export const agentRegister = async (req: Request, res: Response) => {
  try {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      businessName,
      businessAddress,
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

    // Create user with AGENT role (status PENDING - awaiting admin approval)
    const newUser = await Users.createUser({
      email,
      phone,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      role: UserRole.AGENT,
      date_of_birth: dateOfBirth || null,
      nid_number: nidNumber || null,
      status: UserStatus.PENDING, // Agents need admin approval
    });

    // Create wallet for the agent
    await Wallets.createWallet({
      user_id: newUser.id,
    });

    // Create agent profile
    const newAgent = await Agents.createAgent({
      user_id: newUser.id,
      business_name: businessName,
      business_address: businessAddress,
    });

    logger.info(
      `Agent registered: ${newUser.id} (${email}) - Agent Code: ${newAgent.agent_code} - Status: PENDING`
    );

    return sendResponse(res, STATUS_CREATED, {
      message:
        "Agent registration successful. Your account is pending admin approval. You will be notified once approved.",
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
        agent: {
          id: newAgent.id,
          agentCode: newAgent.agent_code,
          businessName: newAgent.business_name,
          businessAddress: newAgent.business_address,
          status: newAgent.status,
        },
      },
    });
  } catch (error: any) {
    logger.error("Agent registration error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during registration",
    });
  }
};

/**
 * Agent Login Controller
 * POST /api/agents/auth/login
 */
export const agentLogin = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or phone
    const user = await Users.findByEmailOrPhone(identifier);
    if (!user) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Invalid credentials",
      });
    }

    // Verify user is an agent
    if (user.role !== UserRole.AGENT) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Access denied. Agent credentials required.",
      });
    }

    // Check account status
    if (user.status === UserStatus.PENDING) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message:
          "Your agent account is pending approval. Please wait for admin approval.",
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Account is suspended. Please contact support.",
      });
    }

    if (user.status === UserStatus.REJECTED) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message:
          "Your agent registration was rejected. Please contact support for more information.",
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Invalid credentials",
      });
    }

    // Get agent profile
    const agent = await Agents.findByUserId(user.id);
    if (!agent) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent profile not found",
      });
    }

    // Generate token
    const token = generateUserToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update login info
    await Users.updateLoginInfo(user.id);

    // Get wallet balance
    const wallet = await Wallets.findByUserId(user.id);

    logger.info(
      `Agent logged in: ${user.id} (${user.email}) - Agent Code: ${agent.agent_code}`
    );

    return sendResponse(res, STATUS_OK, {
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          walletBalance: wallet?.balance || 0,
        },
        agent: {
          id: agent.id,
          agentCode: agent.agent_code,
          businessName: agent.business_name,
          businessAddress: agent.business_address,
          status: agent.status,
          totalCashouts: agent.total_cashouts,
          totalCommissionEarned: agent.total_commission_earned,
        },
      },
    });
  } catch (error: any) {
    logger.error("Agent login error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during login",
    });
  }
};

/**
 * Get Current Agent Profile
 * GET /api/agents/auth/profile
 */
export const getAgentProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Authentication required",
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User not found",
      });
    }

    // Verify user is an agent
    if (user.role !== UserRole.AGENT) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Access denied. Agent account required.",
      });
    }

    // Get agent profile
    const agent = await Agents.findByUserId(userId);
    if (!agent) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent profile not found",
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
        },
        agent: {
          id: agent.id,
          agentCode: agent.agent_code,
          businessName: agent.business_name,
          businessAddress: agent.business_address,
          status: agent.status,
          totalCashouts: agent.total_cashouts,
          totalCommissionEarned: agent.total_commission_earned,
          approvedBy: agent.approved_by,
          approvedAt: agent.approved_at,
          createdAt: agent.created_at,
        },
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
    });
  } catch (error: any) {
    logger.error("Get agent profile error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while retrieving profile",
    });
  }
};

/**
 * Update Agent Profile
 * PUT /api/agents/auth/profile
 */
export const updateAgentProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Authentication required",
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User not found",
      });
    }

    // Verify user is an agent
    if (user.role !== UserRole.AGENT) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Access denied. Agent account required.",
      });
    }

    const { firstName, lastName, businessName, businessAddress, dateOfBirth } =
      req.body;

    // Update user information
    const userUpdates: any = {};
    if (firstName) userUpdates.first_name = firstName;
    if (lastName) userUpdates.last_name = lastName;
    if (dateOfBirth) userUpdates.date_of_birth = dateOfBirth;

    if (Object.keys(userUpdates).length > 0) {
      await Users.updateById(userId, userUpdates);
    }

    // Update agent information
    const agent = await Agents.findByUserId(userId);
    if (!agent) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent profile not found",
      });
    }

    const agentUpdates: any = {};
    if (businessName) agentUpdates.business_name = businessName;
    if (businessAddress) agentUpdates.business_address = businessAddress;

    if (Object.keys(agentUpdates).length > 0) {
      await Agents.updateById(agent.id, agentUpdates);
    }

    // Get updated data
    const updatedUser = await Users.findById(userId);
    const updatedAgent = await Agents.findByUserId(userId);

    logger.info(`Agent profile updated: ${userId}`);

    return sendResponse(res, STATUS_OK, {
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          phone: updatedUser!.phone,
          firstName: updatedUser!.first_name,
          lastName: updatedUser!.last_name,
          dateOfBirth: updatedUser!.date_of_birth,
        },
        agent: {
          id: updatedAgent!.id,
          agentCode: updatedAgent!.agent_code,
          businessName: updatedAgent!.business_name,
          businessAddress: updatedAgent!.business_address,
        },
      },
    });
  } catch (error: any) {
    logger.error("Update agent profile error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while updating profile",
    });
  }
};

/**
 * Change Agent Password
 * PUT /api/agents/auth/change-password
 */
export const changeAgentPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Authentication required",
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User not found",
      });
    }

    // Verify user is an agent
    if (user.role !== UserRole.AGENT) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Access denied. Agent account required.",
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isPasswordValid = await verifyPassword(
      currentPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await Users.updateById(userId, {
      password_hash: newPasswordHash,
    });

    logger.info(`Agent password changed: ${userId}`);

    return sendResponse(res, STATUS_OK, {
      message: "Password changed successfully",
    });
  } catch (error: any) {
    logger.error("Change agent password error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while changing password",
    });
  }
};
