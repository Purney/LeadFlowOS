import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Bot, BriefcaseBusiness, Clock3, Command, CreditCard, FileQuestion, FileText, Hammer, HeartPulse, Rocket, Route, Search, Settings, Share2, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/command", label: "Command", icon: Command },
  { href: "/accounts", label: "Accounts", icon: Route },
  { href: "/research", label: "Research", icon: Search },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/sales", label: "Sales", icon: BriefcaseBusiness },
  { href: "/onboarding", label: "Onboarding", icon: Rocket },
  { href: "/execution", label: "Execution", icon: Hammer },
  { href: "/maintenance", label: "Maintenance", icon: HeartPulse },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/discovery", label: "Discovery", icon: FileQuestion },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/revenue", label: "Revenue", icon: CreditCard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/portal", label: "Portal", icon: Share2 },
  { href: "/clients", label: "Time", icon: Clock3 },
  { href: "/dashboard", label: "Settings", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-card lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            LeadFlow OS
          </Link>
          <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
            MVP
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible">
          {navItems.map((item) => (
            <Link
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              href={item.href}
              key={item.label}
            >
              <item.icon aria-hidden className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur">
          <div>
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.role}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </header>
        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
