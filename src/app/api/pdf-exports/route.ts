import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createPdfExport, listPdfExports } from "@/services/portal-service";
import { pdfExportInputSchema } from "@/validation/portal";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const exports = await listPdfExports(session.user.organisationId);
  return NextResponse.json({ exports });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const pdfExport = await createPdfExport(
      { organisationId: session.user.organisationId, userId: session.user.id },
      pdfExportInputSchema.parse(await request.json()),
    );

    if (!pdfExport) {
      return NextResponse.json(
        { error: "Client or proposal not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ export: pdfExport }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid PDF export data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "PDF export failed." }, { status: 500 });
  }
}
