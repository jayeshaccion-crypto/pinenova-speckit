import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: { code: "DISABLED", message: "Setup disabled in production" } }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || password.length < 8) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Valid email and password (min 8 chars) required" } }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: { code: "EXISTS", message: "User already exists" } }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName: "Admin", lastName: "User", role: "ADMIN" },
    });

    logger.info({ userId: user.id }, "Initial admin created via setup endpoint");
    return Response.json({ message: "Admin user created", userId: user.id }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Admin setup failed");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Setup failed" } }, { status: 500 });
  }
}
