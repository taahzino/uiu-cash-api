import { Request, Response } from "express";
import logger from "../config/_logger";
import { Agents, AgentStatus } from "../models/Agents.model";
import { Users, UserStatus } from "../models/Users.model";
import { Wallets } from "../models/Wallets.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
} from "../utilities/response";

/**
 * Get Agents Paginated with Search and Filters (Admin)
 * POST /api/admin/agents/list
 */
export const getAgentsPaginated = async (req: Request, res: Response) => {
  try {
    const { offset, limit, search, startDate, endDate, status } = req.body;
    console.log("[AGENT PAGINATED] Request body:", {
      offset,
      limit,
      search,
      startDate,
      endDate,
      status,
    });

    let conditions: any = {};
    if (status) conditions.status = status;

    // Add date range filter if provided
    if (startDate && endDate) {
      conditions.created_at_range = { start: startDate, end: endDate };
    } else if (startDate) {
      conditions.created_at_gte = startDate;
    } else if (endDate) {
      conditions.created_at_lte = endDate;
    }

    let agents;
    let total;

    if (search && search.trim()) {
      console.log("[AGENT PAGINATED] Search mode:", search);
      // Search by agent code or business name
      agents = await Agents.findAll({}, 1000, 0); // Get all first
      agents = agents.filter((agent: any) => {
        const matchesSearch =
          agent.agent_code?.toLowerCase().includes(search.toLowerCase()) ||
          agent.business_name?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (status && agent.status !== status) return false;
        if (startDate && new Date(agent.created_at) < new Date(startDate))
          return false;
        if (endDate && new Date(agent.created_at) > new Date(endDate))
          return false;
        return true;
      });
      total = agents.length;
      agents = agents.slice(offset, offset + limit);
      console.log(
        "[AGENT PAGINATED] Filtered agents:",
        agents.length,
        "total:",
        total,
      );
    } else {
      console.log("[AGENT PAGINATED] Normal mode with conditions:", conditions);
      agents = await Agents.findAll(conditions, limit, offset);
      total = await Agents.count(conditions);
      console.log(
        "[AGENT PAGINATED] Found agents:",
        agents.length,
        "total:",
        total,
      );
    }

    // Get user and wallet details for each agent
    const agentsWithDetails = await Promise.all(
      agents.map(async (agent: any) => {
        const user = await Users.findById(agent.user_id);
        const wallet = user ? await Wallets.findByUserId(user.id) : null;
        return {
          id: agent.id,
          userId: agent.user_id,
          agentCode: agent.agent_code,
          businessName: agent.business_name,
          businessAddress: agent.business_address,
          status: agent.status,
          totalCommissionEarned: agent.total_commission_earned,
          createdAt: agent.created_at,
          approvedAt: agent.approved_at,
          user: user
            ? {
                email: user.email,
                phone: user.phone,
                firstName: user.first_name,
                lastName: user.last_name,
                status: user.status,
              }
            : null,
          wallet: wallet
            ? {
                balance: wallet.balance,
                availableBalance: wallet.available_balance,
              }
            : null,
        };
      }),
    );

    return sendResponse(res, STATUS_OK, {
      message: "Agents retrieved successfully",
      data: {
        agents: agentsWithDetails,
        pagination: {
          offset,
          limit,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get agents paginated error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching agents",
    });
  }
};

/**
 * Get All Pending Agents (Admin)
 * GET /api/admin/agents/pending
 */
export const getPendingAgents = async (req: Request, res: Response) => {
  try {
    const pendingAgents = await Agents.findPendingAgents();

    // Get user details for each agent
    const agentsWithUsers = await Promise.all(
      pendingAgents.map(async (agent) => {
        const user = await Users.findById(agent.user_id);
        return {
          ...agent,
          user: user
            ? {
                email: user.email,
                phone: user.phone,
                first_name: user.first_name,
                last_name: user.last_name,
              }
            : null,
        };
      }),
    );

    return sendResponse(res, STATUS_OK, {
      message: "Pending agents retrieved successfully",
      data: {
        agents: agentsWithUsers,
        total: agentsWithUsers.length,
      },
    });
  } catch (error: any) {
    logger.error("Get pending agents error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to retrieve pending agents",
    });
  }
};

/**
 * Approve Agent (Admin)
 * POST /api/admin/agents/:id/approve
 */
export const approveAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = res.locals.admin?.id;

    if (!adminId) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Admin ID not found in token",
      });
    }

    // Find agent
    const agent = await Agents.findById(id);
    if (!agent) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent not found",
      });
    }

    // Check if already processed
    if (agent.status !== AgentStatus.PENDING) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: `Agent is already ${agent.status.toLowerCase()}`,
      });
    }

    // Approve agent
    const approvedAgent = await Agents.approveAgent(id, adminId);

    // Update user status to ACTIVE
    await Users.updateById(agent.user_id, { status: UserStatus.ACTIVE });

    logger.info(`Admin ${adminId} approved agent ${id} (${agent.agent_code})`);

    return sendResponse(res, STATUS_OK, {
      message: "Agent approved successfully",
      data: {
        agent: approvedAgent,
      },
    });
  } catch (error: any) {
    logger.error("Approve agent error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to approve agent",
    });
  }
};

/**
 * Reject Agent (Admin)
 * POST /api/admin/agents/:id/reject
 */
export const rejectAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = res.locals.admin?.id;

    if (!adminId) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Admin ID not found in token",
      });
    }

    if (!reason || reason.trim().length < 10) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Rejection reason must be at least 10 characters",
      });
    }

    // Find agent
    const agent = await Agents.findById(id);
    if (!agent) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent not found",
      });
    }

    // Check if already processed
    if (agent.status !== AgentStatus.PENDING) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: `Agent is already ${agent.status.toLowerCase()}`,
      });
    }

    // Reject agent
    const rejectedAgent = await Agents.rejectAgent(id, adminId, reason);

    // Update user status to REJECTED
    await Users.updateById(agent.user_id, { status: UserStatus.REJECTED });

    logger.info(
      `Admin ${adminId} rejected agent ${id} (${agent.agent_code}) - Reason: ${reason}`,
    );

    return sendResponse(res, STATUS_OK, {
      message: "Agent rejected successfully",
      data: {
        agent: rejectedAgent,
      },
    });
  } catch (error: any) {
    logger.error("Reject agent error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to reject agent",
    });
  }
};

/**
 * Get Agent Details (Admin)
 * GET /api/admin/agents/:id
 */
export const getAgentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await Agents.findById(id);
    if (!agent) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent not found",
      });
    }

    // Get user details
    const user = await Users.findById(agent.user_id);

    // Get approver details if exists
    let approver: any = null;
    if (agent.approved_by) {
      const { Admins } = await import("../models/Admins.model");
      approver = await Admins.findById(agent.approved_by);
    }

    return sendResponse(res, STATUS_OK, {
      message: "Agent details retrieved successfully",
      data: {
        agent: {
          ...agent,
          user: user
            ? {
                id: user.id,
                email: user.email,
                phone: user.phone,
                first_name: user.first_name,
                last_name: user.last_name,
                status: user.status,
                created_at: user.created_at,
              }
            : null,
          approver: approver
            ? {
                id: approver.id,
                name: approver.name,
                email: approver.email,
              }
            : null,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get agent details error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to retrieve agent details",
    });
  }
};
