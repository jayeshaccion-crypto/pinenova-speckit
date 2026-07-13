import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, refreshToken: { create: vi.fn(), findMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() } } }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, refreshToken: { create: vi.fn(), findMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() } } }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(), rateLimitResponse: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditEvent: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), emailTemplates: { passwordReset: vi.fn(() => ({ subject: "Reset", html: "<p>Reset</p>" })) } }));
vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
  comparePassword: vi.fn(),
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  signResetToken: vi.fn().mockResolvedValue("reset-token"),
  verifyResetToken: vi.fn(),
  clearUserRefreshTokens: vi.fn(),
  rotateRefreshToken: vi.fn(),
}));

import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as refreshPost } from "@/app/api/auth/refresh/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { comparePassword, signAccessToken, signRefreshToken, verifyResetToken, rotateRefreshToken } from "@/lib/auth";

function makeRequest(body: any, origin?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (origin === undefined) {
    headers["origin"] = "http://localhost:3000";
    headers["referer"] = "http://localhost:3000/account/auth/login";
  }
  return new Request("http://localhost:3000/api/auth/test", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function mockUser(email = "test@example.com") {
  return { id: "user-1", email, firstName: "Test", lastName: "User", role: "CUSTOMER", status: "ACTIVE", passwordHash: "$2a$12$hashed", createdAt: new Date(), totpEnabled: false, totpSecret: null } as any;
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
  });

  it("creates a user and returns 201", async () => {
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser("new@example.com"));
    const res = await registerPost(makeRequest({
      email: "new@example.com", password: "Pass1234", confirmPassword: "Pass1234", firstName: "New", lastName: "User",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("new@example.com");
  });

  it("returns 409 for duplicate email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser());
    const res = await registerPost(makeRequest({
      email: "test@example.com", password: "Pass1234", confirmPassword: "Pass1234", firstName: "Test", lastName: "User",
    }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("EMAIL_EXISTS");
  });

  it("returns 400 for weak password", async () => {
    const res = await registerPost(makeRequest({
      email: "new@example.com", password: "weak", confirmPassword: "weak", firstName: "New", lastName: "User",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const res = await registerPost(makeRequest({
      email: "not-an-email", password: "Pass1234", confirmPassword: "Pass1234", firstName: "New", lastName: "User",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for mismatched passwords", async () => {
    const res = await registerPost(makeRequest({
      email: "new@example.com", password: "Pass1234", confirmPassword: "Pass1234x", firstName: "New", lastName: "User",
    }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser());
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(signAccessToken).mockResolvedValue("access-token");
    vi.mocked(signRefreshToken).mockResolvedValue("refresh-token");
  });

  it("returns tokens for valid credentials", async () => {
    const res = await loginPost(makeRequest({ email: "test@example.com", password: "Pass1234" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBe("access-token");
    expect(body.refreshToken).toBe("refresh-token");
    expect(body.user.email).toBe("test@example.com");
  });

  it("returns 401 for wrong password", async () => {
    vi.mocked(comparePassword).mockResolvedValue(false);
    const res = await loginPost(makeRequest({ email: "test@example.com", password: "WrongPass1" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 on rate limit exceeded", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await loginPost(makeRequest({ email: "test@example.com", password: "Pass1234" }));
    expect(res.status).toBe(429);
  });

  it("returns requiresTwoFactor when user has 2FA enabled", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser(), totpEnabled: true, totpSecret: "secret" } as any);
    vi.mocked(signAccessToken).mockResolvedValue("temp-token");
    const res = await loginPost(makeRequest({ email: "test@example.com", password: "Pass1234" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.requiresTwoFactor).toBe(true);
    expect(body.tempToken).toBe("temp-token");
  });
});

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 2, resetAt: Date.now() + 60000 });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser());
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser());
  });

  it("sends reset email when email provided", async () => {
    const res = await resetPasswordPost(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("sent");
  });

  it("resets password with valid token", async () => {
    vi.mocked(verifyResetToken).mockResolvedValue("test@example.com");
    const res = await resetPasswordPost(makeRequest({ token: "valid-token", password: "NewPass1234" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("updated");
  });

  it("returns 400 for expired token", async () => {
    vi.mocked(verifyResetToken).mockResolvedValue(null);
    const res = await resetPasswordPost(makeRequest({ token: "expired-token", password: "NewPass1234" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_TOKEN");
  });
});

describe("POST /api/auth/register — CSRF", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 403 without origin or referer", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "Pass1234", confirmPassword: "Pass1234", firstName: "Test", lastName: "User" }),
    });
    const res = await registerPost(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("CSRF_REJECTED");
  });

  it("returns 403 with wrong origin", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.com" },
      body: JSON.stringify({ email: "test@example.com", password: "Pass1234", confirmPassword: "Pass1234", firstName: "Test", lastName: "User" }),
    });
    const res = await registerPost(req);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rotateRefreshToken).mockResolvedValue({ accessToken: "new-access", refreshToken: "new-refresh" });
  });

  it("returns 401 for reused/invalid refresh token", async () => {
    vi.mocked(rotateRefreshToken).mockResolvedValue(null);
    const res = await refreshPost(makeRequest({ refreshToken: "used-token" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("returns new token pair for valid refresh token", async () => {
    const res = await refreshPost(makeRequest({ refreshToken: "valid-token" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBe("new-access");
    expect(body.refreshToken).toBe("new-refresh");
  });
});

describe("POST /api/auth/login — rate limit per endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
  });

  it("returns 429 when login rate limited", async () => {
    const res = await loginPost(makeRequest({ email: "test@example.com", password: "Pass1234" }));
    expect(res.status).toBe(429);
  });
});
