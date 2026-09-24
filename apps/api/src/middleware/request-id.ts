/**
 * Request ID Middleware
 * 
 * Generates unique request IDs for tracking and correlation across logs
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";

declare module "fastify" {
  interface FastifyRequest {
    id: string;
  }
}

export async function requestIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Check if client sent a request ID
  const clientRequestId =
    request.headers["x-request-id"] ||
    request.headers["x-correlation-id"] ||
    request.headers["request-id"];

  // Use client ID if valid, otherwise generate new
  const requestId =
    typeof clientRequestId === "string" && clientRequestId.length > 0 && clientRequestId.length < 256
      ? clientRequestId
      : randomUUID();

  // Attach to request object
  request.id = requestId;

  // Add to response headers
  reply.header("X-Request-ID", requestId);

  // Add to logger context
  request.log = request.log.child({ reqId: requestId });
}
