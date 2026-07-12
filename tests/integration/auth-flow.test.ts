import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() }, order: { findMany: vi.fn(), count: vi.fn() }, refreshToken: { deleteMany: vi.fn() } } }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/audit", () => ({ logAuditEvent: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-deleted-email"),
  clearUserRefreshTokens: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

import { GET as getOrders } from "@/app/api/account/orders/route";
import { GET as getData, DELETE as deleteData } from "@/app/api/account/data/route";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";

function makeAuthedRequest(body?: any, method: string = "GET"): Request {
  const headers: Record<string, string> = {
    authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiQ1VTVE9NRVIifQ.test",
    "content-type": "application/json",
  };
  const init: RequestInit = { method, headers };
  if (body && method !== "GET" && method !== "HEAD") {
    init.body = JSON.stringify(body);
  }
  return new Request("http://localhost:3000/api/account/test", init);
}

function makeUnauthedRequest(): Request {
  return new Request("http://localhost:3000/api/account/test", {
    method: "GET",
    headers: { "content-type": "application/json" },
  });
}

const mockOrders = [
  { id: "ord-1", orderNumber: "ORD-260712-ABCD", status: "CONFIRMED", total: 5000, createdAt: new Date(), items: [] },
  { id: "ord-2", orderNumber: "ORD-260711-EFGH", status: "SHIPPED", total: 3500, createdAt: new Date(), items: [] },
];

const mockUser = {
  id: "user-1", email: "test@example.com", firstName: "Test", lastName: "User",
  role: "CUSTOMER", createdAt: new Date(), orders: mockOrders,
};

describe("GET /api/account/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "user-1", role: "CUSTOMER" });
  });

  it("returns 401 without auth token", async () => {
    const res = await getOrders(makeUnauthedRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns orders for authenticated user", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);
    vi.mocked(prisma.order.count).mockResolvedValue(2);

    const res = await getOrders(makeAuthedRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it("returns empty list when user has no orders", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    const res = await getOrders(makeAuthedRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(0);
  });
});

describe("GET /api/account/data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "user-1", role: "CUSTOMER" });
  });

  it("returns 401 without auth token", async () => {
    const res = await getData(makeUnauthedRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns user data for authenticated user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const res = await getData(makeAuthedRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.email).toBe("test@example.com");
    expect(body.data.orders).toHaveLength(2);
  });
});

describe("DELETE /api/account/data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "user-1", role: "CUSTOMER" });
  });

  it("returns 401 without auth token", async () => {
    const req = new Request("http://localhost:3000/api/account/test", { method: "DELETE", headers: { "content-type": "application/json" } });
    const res = await deleteData(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 without DELETE confirmation", async () => {
    const res = await deleteData(makeAuthedRequest({ confirm: "NO" }, "DELETE"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("CONFIRMATION_REQUIRED");
  });

  it("deletes account with DELETE confirmation", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const res = await deleteData(makeAuthedRequest({ confirm: "DELETE" }, "DELETE"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("deleted");
  });

  it("preserves order records on deletion", async () => {
    const userWithOrders = {
      ...mockUser,
      orders: [
        { id: "ord-1", orderNumber: "ORD-260712-ABCD", status: "CONFIRMED", total: 5000, createdAt: new Date(), items: [] },
        { id: "ord-2", orderNumber: "ORD-260711-EFGH", status: "SHIPPED", total: 3500, createdAt: new Date(), items: [] },
      ],
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithOrders as any);
    vi.mocked(prisma.user.update).mockResolvedValue(userWithOrders as any);

    const res = await deleteData(makeAuthedRequest({ confirm: "DELETE" }, "DELETE"));
    expect(res.status).toBe(200);

    await getData(makeAuthedRequest());
    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data).toHaveProperty("email");
    expect(updateCall.data).toHaveProperty("passwordHash", null);
  });
});
