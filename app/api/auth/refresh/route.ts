import { logger } from "@/lib/logger";
import { rotateRefreshToken } from "@/lib/auth";
import { apiError, apiSuccess, handleApiError, checkCSRF } from "@/lib/api-utils";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    let refreshToken = typeof (request as any).cookies?.get === "function"
      ? (request as any).cookies.get("refreshToken")?.value
      : undefined;

    if (!refreshToken) {
      const body = await request.json();
      if (!body.refreshToken || typeof body.refreshToken !== "string") {
        return apiError("VALIDATION_ERROR", "Refresh token is required", 400);
      }
      refreshToken = body.refreshToken;
    }

    const result = await rotateRefreshToken(refreshToken);

    if (!result) {
      logger.warn({}, "Refresh token reuse or invalid token");
      return apiError("INVALID_TOKEN", "Refresh token is invalid or has been revoked", 401);
    }

    await logAuditEvent({ userId: result.accessToken, action: "TOKEN_REFRESHED", entity: "RefreshToken" });

    const response = apiSuccess({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    logger.error({ error }, "Token refresh failed");
    return handleApiError(error, "refresh");
  }
}
