import { NextResponse } from "next/server";
import { getPublicPortal } from "@/services/portal-service";
import { renderSimplePdfFromHtml } from "@/utils/pdf";

type RouteContext = {
  params: Promise<{ token: string; exportId: string }>;
};

function filename(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "export"}.pdf`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token, exportId } = await context.params;
  const portal = await getPublicPortal(token);

  if (!portal) {
    return NextResponse.json({ error: "Portal not found." }, { status: 404 });
  }

  const pdfExport = portal.pdfExports.find(
    (item) => item._id.toString() === exportId,
  );

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
