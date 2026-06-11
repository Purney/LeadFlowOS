import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBootstrapStatus } from "@/services/organisation-service";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  let shouldCreateOwner = false;

  try {
    shouldCreateOwner = !(await getBootstrapStatus()).hasOwner;
  } catch {
    shouldCreateOwner = false;
  }

  if (shouldCreateOwner) {
    redirect("/signup");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <p className="text-sm font-medium text-muted-foreground">LeadFlow OS</p>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          No owner yet?{" "}
          <Link className="font-medium text-primary" href="/signup">
            Create the first workspace
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
