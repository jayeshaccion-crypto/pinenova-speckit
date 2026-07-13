import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { env } from "./env";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

const ACCESS_TOKEN_TTL = env.JWT_ACCESS_TTL;
const REFRESH_TOKEN_TTL = env.JWT_REFRESH_TTL;
const BCRYPT_ROUNDS = 12;

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(payload: { sub: string; role: string }): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({ sub: userId } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(JWT_REFRESH_SECRET);

  const refreshTtlMs = parseDuration(REFRESH_TOKEN_TTL);
  const expiresAt = new Date(Date.now() + refreshTtlMs);
  const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { sub: payload.sub as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
  const storedTokens = await prisma.refreshToken.findMany({
    where: { expiresAt: { gt: new Date() } },
  });

  let validToken = false;
  let userId = "";

  for (const stored of storedTokens) {
    if (await bcrypt.compare(oldToken, stored.tokenHash)) {
      validToken = true;
      userId = stored.userId;
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      break;
    }
  }

  if (!validToken) return null;

  const accessToken = await signAccessToken({
    sub: userId,
    role: (await prisma.user.findUnique({ where: { id: userId } }))?.role || "CUSTOMER",
  });
  const refreshToken = await signRefreshToken(userId);

  return { accessToken, refreshToken, userId };
}

export async function invalidateRefreshToken(token: string): Promise<void> {
  const storedTokens = await prisma.refreshToken.findMany();
  for (const stored of storedTokens) {
    if (await bcrypt.compare(token, stored.tokenHash)) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      return;
    }
  }
}

export async function clearUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function signResetToken(email: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return new SignJWT({ sub: email, purpose: "password-reset" } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== "password-reset") return null;
    return payload.sub as string;
  } catch {
    return null;
  }
}
