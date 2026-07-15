import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);

  if (!auth) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, totpEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      twoFactorEnabled: user.totpEnabled,
    },
  });
}
