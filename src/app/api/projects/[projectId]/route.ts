import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateProject } from "@/services/client-service";
import { projectUpdateSchema } from "@/validation/client";

type Params = { params: Promise<{ projectId: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const { projectId } = await params;
    const project = await updateProject(
      { organisationId: session.user.organisationId, userId: session.user.id },
      projectId,
      projectUpdateSchema.parse(await request.json()),
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
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
