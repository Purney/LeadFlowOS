import { redirect } from "next/navigation";
import { Bot, Mail, MessageSquareText } from "lucide-react";
import { auth } from "@/auth";
import { ColdEmailForm } from "@/components/ai/cold-email-form";
import { ReplyDraftForm } from "@/components/ai/reply-draft-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAiDrafts } from "@/services/ai-service";
import { listLeads } from "@/services/lead-service";
import type { ColdEmailDraftContent, ReplyDraftContent } from "@/types/ai";

type DraftView = {
  _id: { toString(): string };
  type: "cold_email" | "reply";
  content: ColdEmailDraftContent | ReplyDraftContent;
  createdAt: Date;
};

export default async function AiPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [leads, drafts] = await Promise.all([
    listLeads({ organisationId: session.user.organisationId }),
    listAiDrafts(session.user.organisationId),
  ]);
  const leadOptions = leads.map((lead) => ({
    id: lead._id.toString(),
    label:
      [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
      lead.email,
  }));
  const draftViews = drafts as DraftView[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI drafts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate cold email copy and reply drafts for manual review. Drafts are
          never sent automatically.
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
            <CardTitle className="text-sm text-muted-foreground">Cold email</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">
              {draftViews.filter((draft) => draft.type === "cold_email").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Replies</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <MessageSquareText className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">
              {draftViews.filter((draft) => draft.type === "reply").length}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI cold email generation</CardTitle>
          </CardHeader>
          <CardContent>
            <ColdEmailForm leads={leadOptions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI reply drafting</CardTitle>
          </CardHeader>
          <CardContent>
            <ReplyDraftForm leads={leadOptions} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent drafts</h2>
        {draftViews.length > 0 ? (
          draftViews.map((draft) => (
            <Card key={draft._id.toString()}>
              <CardHeader>
                <CardTitle>{draft.type === "cold_email" ? "Cold email" : "Reply draft"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(draft.createdAt).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {draft.type === "cold_email" ? (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Subjects</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {(draft.content as ColdEmailDraftContent).subjects.map((subject) => (
                          <li key={subject}>{subject}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                      {(draft.content as ColdEmailDraftContent).body}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="rounded-md bg-muted p-4 text-sm">
                      {(draft.content as ReplyDraftContent).summary}
                    </p>
                    <p className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                      {(draft.content as ReplyDraftContent).suggestedResponse}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No AI drafts yet. Generate one from an existing lead.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
