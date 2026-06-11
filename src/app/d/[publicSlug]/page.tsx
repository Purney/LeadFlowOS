import { notFound } from "next/navigation";
import { PublicResponseForm } from "@/components/discovery/public-response-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicDiscoveryForm } from "@/services/discovery-service";
import type { DiscoveryField } from "@/types/discovery";

type PublicDiscoveryPageProps = {
  params: Promise<{ publicSlug: string }>;
};

export default async function PublicDiscoveryPage({
  params,
}: PublicDiscoveryPageProps) {
  const { publicSlug } = await params;
  const form = await getPublicDiscoveryForm(publicSlug);

  if (!form) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">LeadFlow OS</p>
          <CardTitle>{form.name}</CardTitle>
          {form.description ? (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <PublicResponseForm
            publicSlug={publicSlug}
            fields={form.fields as DiscoveryField[]}
          />
        </CardContent>
      </Card>
    </main>
  );
}
