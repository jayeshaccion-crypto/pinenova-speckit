import { NextResponse } from "next/server";
import { invalidateRefreshToken } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  let refreshToken: string | null = null;

  if (cookieHeader) {
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    if (match) refreshToken = match[1];
  }

  if (refreshToken) {
    await invalidateRefreshToken(refreshToken);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("accessToken", "", { maxAge: 0, path: "/", httpOnly: true, sameSite: "lax" });
  response.cookies.set("refreshToken", "", { maxAge: 0, path: "/", httpOnly: true, sameSite: "lax" });
  response.cookies.set("cart_session_id", "", { maxAge: 0, path: "/" });

  return response;
}