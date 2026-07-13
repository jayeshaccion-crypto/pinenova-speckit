import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthUser, apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { UpdateProfileSchema } from "@/types";
import { hashPassword, comparePassword } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return apiError("UNAUTHORIZED", "Authentication required", 401);

    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { id: true, email: true, firstName: true, lastName: true, totpEnabled: true, createdAt: true },
    });

    if (!user) return apiError("NOT_FOUND", "User not found", 404);

    return apiSuccess({ data: user });
  } catch (error) {
    logger.error({ error }, "Failed to get profile");
    return handleApiError(error, "account.profile.get");
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return apiError("UNAUTHORIZED", "Authentication required", 401);

    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid input", 400, parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })));
    }

    const { firstName, lastName, email, currentPassword, password } = parsed.data;

    const updateData: Record<string, any> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    if (email !== undefined) {
      if (!currentPassword) return apiError("VALIDATION_ERROR", "Current password required to change email", 400);

      const user = await prisma.user.findUnique({ where: { id: auth.sub } });
      if (!user || !user.passwordHash) return apiError("FORBIDDEN", "Cannot change email on social login accounts", 403);

      const valid = await comparePassword(currentPassword, user.passwordHash);
      if (!valid) return apiError("VALIDATION_ERROR", "Current password is incorrect", 400);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== auth.sub) return apiError("CONFLICT", "Email already in use", 409);

      updateData.email = email;
    }

    if (password !== undefined) {
      if (!currentPassword) return apiError("VALIDATION_ERROR", "Current password required to change password", 400);

      const user = await prisma.user.findUnique({ where: { id: auth.sub } });
      if (!user || !user.passwordHash) return apiError("FORBIDDEN", "Cannot change password on social login accounts", 403);

      const valid = await comparePassword(currentPassword, user.passwordHash);
      if (!valid) return apiError("VALIDATION_ERROR", "Current password is incorrect", 400);

      updateData.passwordHash = await hashPassword(password);
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("VALIDATION_ERROR", "No fields to update", 400);
    }

    const updated = await prisma.user.update({
      where: { id: auth.sub },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, totpEnabled: true },
    });

    logger.info({ userId: auth.sub, fields: Object.keys(updateData) }, "Profile updated");
    return apiSuccess({ data: updated });
  } catch (error) {
    logger.error({ error }, "Failed to update profile");
    return handleApiError(error, "account.profile.update");
  }
}
