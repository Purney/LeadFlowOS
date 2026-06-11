import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listNotifications } from "@/services/notification-service";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const notifications = await listNotifications(session.user.organisationId);
  return NextResponse.json({ notifications });
}
