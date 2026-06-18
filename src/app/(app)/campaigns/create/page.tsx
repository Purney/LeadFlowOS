import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const secondaryLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted";

export default async function CreateCampaignPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create campaign</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Build a draft multi-stage sequence with separate A/B subject and body
            variants.
          </p>
        </div>
        <Link className={secondaryLinkClass} href="/campaigns">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to campaigns
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draft campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCampaignForm />
        </CardContent>
      </Card>
    </div>
  );
}
