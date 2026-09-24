/**
 * Request Logger Middleware
 * 
 * Logs all HTTP requests with structured data
 */

import type { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    startTime?: number;
  }
}

export async function requestLoggerMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Record start time
  request.startTime = Date.now();

  // Log incoming request
  request.log.info(
    {
      req: {
        method: request.method,
        url: request.url,
        headers: {
          "user-agent": request.headers["user-agent"],
          "content-type": request.headers["content-type"],
        },
        remoteAddress: request.ip,
      },
    },
    "incoming request",
  );
}

export async function responseLoggerHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const responseTime = request.startTime ? Date.now() - request.startTime : 0;

  request.log.info(
    {
      res: {
        statusCode: reply.statusCode,
      },
      responseTime,
    },
    "request completed",
  );

  // Warn on slow requests (> 2s)
  if (responseTime > 2000) {
    request.log.warn(
      {
        responseTime,
        method: request.method,
        url: request.url,
      },
      "slow request detected",
    );
  }

  // Error logging for 5xx
  if (reply.statusCode >= 500) {
    request.log.error(
      {
        statusCode: reply.statusCode,
        method: request.method,
        url: request.url,
      },
      "server error response",
    );
  }
}
