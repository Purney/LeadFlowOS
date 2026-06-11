import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createProject, listProjects } from "@/services/client-service";
import { projectInputSchema } from "@/validation/client";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  return NextResponse.json({
    projects: await listProjects(session.user.organisationId),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const project = await createProject(
      { organisationId: session.user.organisationId, userId: session.user.id },
      projectInputSchema.parse(await request.json()),
    );

    if (!project) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid project data." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Project request failed." }, { status: 500 });
  }
}
