import { Boxes, CheckCircle2, CircleAlert, ListTodo } from "lucide-react";
import type { ComponentType } from "react";
import {
  DeliverableForm,
  ExecutionTaskForm,
  MilestoneForm,
  ProjectProgressForm,
} from "@/components/execution/execution-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExecutionWorkspace } from "@/services/execution-service";
import { auth } from "@/auth";

function id(value: unknown) {
  return String(value);
}

function date(value?: Date | string) {
  return value ? new Date(value).toLocaleDateString() : "No date";
}

export default async function ExecutionPage() {
  const session = await auth();
  const { projects, milestones, tasks, deliverables, metrics } =
    await getExecutionWorkspace(session!.user.organisationId);
  const projectOptions = projects.map((project) => ({
    id: id(project._id),
    label: project.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 18</p>
        <h1 className="text-3xl font-semibold tracking-tight">Solution Execution</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Manage delivery health, milestones, tasks, deliverables, and
          client-visible progress after onboarding.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Open tasks" value={metrics.openTasks} icon={ListTodo} />
        <Metric label="Blocked tasks" value={metrics.blockedTasks} icon={CircleAlert} />
        <Metric label="Ready deliverables" value={metrics.deliverablesReady} icon={CheckCircle2} />
        <Metric label="Overdue milestones" value={metrics.overdueMilestones} icon={Boxes} />
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Project progress</CardTitle></CardHeader>
          <CardContent><ProjectProgressForm projects={projectOptions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Milestone</CardTitle></CardHeader>
          <CardContent><MilestoneForm projects={projectOptions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Task</CardTitle></CardHeader>
          <CardContent><ExecutionTaskForm projects={projectOptions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deliverable</CardTitle></CardHeader>
          <CardContent><DeliverableForm projects={projectOptions} /></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Projects will appear after onboarding or client setup.</p>
            ) : (
              projects.map((project) => (
                <div className="rounded-md border border-border p-3" key={id(project._id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.type} · {project.status} · {project.health}
                      </p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {project.progressPercent ?? 0}%
                    </span>
                  </div>
                  {project.clientVisibleSummary ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {project.clientVisibleSummary}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Execution queue</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Queue title="Milestones" items={milestones.map((item) => ({
              id: id(item._id),
              title: item.title,
              meta: `${item.status} · Due ${date(item.dueDate)}`,
            }))} />
            <Queue title="Tasks" items={tasks.slice(0, 8).map((item) => ({
              id: id(item._id),
              title: item.title,
              meta: `${item.status} · ${item.assigneeName ?? "Unassigned"}`,
            }))} />
            <Queue title="Deliverables" items={deliverables.slice(0, 8).map((item) => ({
              id: id(item._id),
              title: item.title,
              meta: item.status,
            }))} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Queue({ title, items }: { title: string; items: { id: string; title: string; meta: string }[] }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          items.map((item) => (
            <div className="rounded-md border border-border p-2 text-sm" key={item.id}>
              <p className="font-medium">{item.title}</p>
              <p className="text-muted-foreground">{item.meta}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
