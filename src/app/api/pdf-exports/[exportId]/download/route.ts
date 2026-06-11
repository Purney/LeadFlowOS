import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPdfExport } from "@/services/portal-service";
import { renderSimplePdfFromHtml } from "@/utils/pdf";

type RouteContext = {
  params: Promise<{ exportId: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function filename(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "export"}.pdf`;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const { exportId } = await context.params;
  const pdfExport = await getPdfExport(session.user.organisationId, exportId);

  if (!pdfExport) {
    return NextResponse.json({ error: "PDF export not found." }, { status: 404 });
  }

  const body = renderSimplePdfFromHtml(pdfExport.title, pdfExport.html);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename(pdfExport.title)}"`,
    },
  });
}
