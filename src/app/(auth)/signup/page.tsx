import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEnv } from "@/lib/env";
import { getBootstrapStatus } from "@/services/organisation-service";

export default async function SignupPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  let shouldSignIn = false;

  try {
    const [status, env] = await Promise.all([getBootstrapStatus(), getEnv()]);
    shouldSignIn = status.hasOwner && !env.ALLOW_ADDITIONAL_ORG_SIGNUPS;
  } catch {
    shouldSignIn = false;
  }

  if (shouldSignIn) {
    redirect("/login");
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <p className="text-sm font-medium text-muted-foreground">LeadFlow OS</p>
        <CardTitle>Create the owner workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already set up?{" "}
          <Link className="font-medium text-primary" href="/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
