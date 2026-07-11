import { prisma } from "./db";
import { logger } from "./logger";

export async function logAuditEvent(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params as unknown as never });
    logger.info({ action: params.action, entity: params.entity, entityId: params.entityId }, "Audit event logged");
  } catch (error) {
    logger.error({ error, ...params }, "Failed to log audit event");
  }
}
