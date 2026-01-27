import { Request, Response } from "express";
import logger from "../config/_logger";
import { Agents, AgentStatus } from "../models/Agents.model";
import { Users, UserStatus } from "../models/Users.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
} from "../utilities/response";

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
 * Get All Agents (Admin)
 * GET /api/admin/agents
 */
export const getAllAgents = async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let agents;
    let total;

    if (status && Object.values(AgentStatus).includes(status as AgentStatus)) {
      agents = await Agents.findAll({
        where: { status: status as AgentStatus },
        limit: limitNum,
        offset,
      });
      total = await Agents.countByStatus(status as AgentStatus);
    } else {
      agents = await Agents.findAll({ limit: limitNum, offset });
      total = await Agents.count();
    }

    // Get user details for each agent
    const agentsWithUsers = await Promise.all(
      agents.map(async (agent: any) => {
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
      message: "Agents retrieved successfully",
      data: {
        agents: agentsWithUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get all agents error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to retrieve agents",
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
