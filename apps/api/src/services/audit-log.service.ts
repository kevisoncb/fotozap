/**
 * Audit Log Service
 *
 * Registra ações administrativas para auditoria e compliance.
 */

import type { PrismaClient, AuditAction } from "@prisma/client";

export interface CreateAuditLogInput {
  adminId: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ListAuditLogsInput {
  adminId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}

export class AuditLogService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Registra uma ação administrativa
   */
  async create(input: CreateAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details: input.details ? (input.details as never) : undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Lista logs de auditoria com filtros
   */
  async list(input: ListAuditLogsInput = {}) {
    const { adminId, action, limit = 50, offset = 0 } = input;

    return this.prisma.auditLog.findMany({
      where: {
        ...(adminId && { adminId }),
        ...(action && { action }),
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Busca logs de uma ação específica em um recurso
   */
  async findByResource(resource: string, resourceId: string, limit = 20) {
    return this.prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }

  /**
   * Conta logs por ação
   */
  async countByAction() {
    const logs = await this.prisma.auditLog.groupBy({
      by: ["action"],
      _count: {
        id: true,
      },
    });

    return logs.map((log) => ({
      action: log.action,
      count: log._count.id,
    }));
  }
}
