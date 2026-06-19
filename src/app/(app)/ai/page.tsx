import { redirect } from "next/navigation";
import { Bot, FileQuestion, Search } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAiDrafts } from "@/services/ai-service";
import type {
  DiscoverySummaryContent,
  ResearchSummaryContent,
} from "@/types/ai";

type DraftView = {
  _id: { toString(): string };
  type: "discovery_summary" | "research_summary";
  content: DiscoverySummaryContent | ResearchSummaryContent;
  createdAt: Date;
};

export default async function AiPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const drafts = await listAiDrafts(session.user.organisationId);
  const draftViews = drafts as DraftView[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI drafts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review AI summaries created from research and discovery workflows.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{draftViews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Research summaries</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">
              {draftViews.filter((draft) => draft.type === "research_summary").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Discovery summaries</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">
              {draftViews.filter((draft) => draft.type === "discovery_summary").length}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent drafts</h2>
        {draftViews.length > 0 ? (
          draftViews.map((draft) => (
            <Card key={draft._id.toString()}>
              <CardHeader>
                <CardTitle>
                  {draft.type === "research_summary"
                    ? "Research summary"
                    : "Discovery summary"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(draft.createdAt).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {draft.type === "research_summary" ? (
                  <p className="rounded-md bg-muted p-4 text-sm">
                    {(draft.content as ResearchSummaryContent).fitSummary}
                  </p>
                ) : (
                  <p className="rounded-md bg-muted p-4 text-sm">
                    {(draft.content as DiscoverySummaryContent).objectives.join(", ") ||
                      "Discovery summary generated."}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No AI drafts yet. Generate one from research or discovery.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
