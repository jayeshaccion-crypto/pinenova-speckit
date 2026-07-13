import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-utils";

export async function GET(request: Request) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: { id: user.sub, role: user.role } });
}