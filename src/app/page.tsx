import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBootstrapStatus } from "@/services/organisation-service";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  let hasOwner = false;

  try {
    hasOwner = (await getBootstrapStatus()).hasOwner;
  } catch {
    hasOwner = false;
  }

  redirect(hasOwner ? "/login" : "/signup");
}
