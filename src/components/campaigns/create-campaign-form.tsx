"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Plus, Split, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyPersonalisation,
  personalisationVariables,
} from "@/utils/personalisation";
import { renderSpintax } from "@/utils/spintax";

type VariantField = {
  id: number;
  value: string;
};

type CampaignStage = {
  id: number;
  name: string;
  delayDays: number;
  subjectVariants: VariantField[];
  bodyVariants: VariantField[];
};

type EditableCampaign = {
  id: string;
  name: string;
  goal?: string;
  serviceOffer?: string;
  steps: {
    name: string;
    delayDays: number;
    subjectVariants: string[];
    bodyVariants: string[];
  }[];
};

const sampleLead = {
  firstName: "Grace",
  lastName: "Hopper",
  company: "Compiler Labs",
  website: "compiler.example",
  specificDataPoint: "your team is scaling BIM delivery across several projects",
  normalisedCompany: "Compiler Labs",
  magnetName: "automation opportunity map",
  personalisedWorkflowValue:
    "remove repetitive drawing checks and document admin from live project workflows",
  senderEmailSignature: "Best,\nAlex",
};

function clientId() {
  return Date.now() + Math.floor(Math.random() * 100000);
}

function createVariant(value = ""): VariantField {
  return { id: clientId(), value };
}

function defaultBody() {
  return `Hey {FIRST_NAME},

Saw {SPECIFIC_DATA_POINT} about {NORMALISED_COMPANY} and thought this might be relevant.

I put together a short {MAGNET_NAME} showing how firms like yours could automate a large portion of repetitive drawing and document work without changing existing design workflows.

For previous clients, this freed up 26 admin hours/week across repetitive drawing and document work.

It shows how AI could help {PERSONALISED_WORKFLOW_VALUE}.

Want me to send it so you can see how the system would work for you?

{SENDER_EMAIL_SIGNATURE}`;
}

function createStage(index: number): CampaignStage {
  return {
    id: clientId(),
    name: index === 0 ? "Initial outreach" : `Follow-up ${index}`,
    delayDays: index === 0 ? 0 : 3,
    subjectVariants: [
      createVariant(
        index === 0 ? "Short {MAGNET_NAME} for {NORMALISED_COMPANY}" : "",
      ),
    ],
    bodyVariants: [createVariant(index === 0 ? defaultBody() : "")],
  };
}

function stagesFromCampaign(campaign?: EditableCampaign) {
  if (!campaign?.steps.length) return [createStage(0), createStage(1)];

  return campaign.steps.map((step) => ({
    id: clientId(),
    name: step.name,
    delayDays: step.delayDays,
    subjectVariants: step.subjectVariants.length
      ? step.subjectVariants.map(createVariant)
      : [createVariant()],
    bodyVariants: step.bodyVariants.length
      ? step.bodyVariants.map(createVariant)
      : [createVariant()],
  }));
}

function variantValues(variants: VariantField[]) {
  return variants.map((variant) => variant.value.trim()).filter(Boolean);
}

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(index, length - 1);
}

export function CreateCampaignForm({
  initialCampaign,
}: {
  initialCampaign?: EditableCampaign;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [stages, setStages] = useState<CampaignStage[]>(() =>
    stagesFromCampaign(initialCampaign),
  );
  const [previewStageId, setPreviewStageId] = useState(stages[0].id);
  const [previewSubjectIndex, setPreviewSubjectIndex] = useState(0);
  const [previewBodyIndex, setPreviewBodyIndex] = useState(0);
  const isEditing = Boolean(initialCampaign);

  const previewStage = stages.find((stage) => stage.id === previewStageId) ?? stages[0];
  const previewSubjectVariants = previewStage?.subjectVariants ?? [];
  const previewBodyVariants = previewStage?.bodyVariants ?? [];
  const previewSubject =
    previewSubjectVariants[
      clampIndex(previewSubjectIndex, previewSubjectVariants.length)
    ]?.value || "Add a subject variant.";
  const previewBody =
    previewBodyVariants[clampIndex(previewBodyIndex, previewBodyVariants.length)]
      ?.value || "Add a body variant.";

  function updateStage(id: number, patch: Partial<CampaignStage>) {
    setStages((current) =>
      current.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)),
    );
  }

  function updateVariant(
    stageId: number,
    field: "subjectVariants" | "bodyVariants",
    variantId: number,
    value: string,
  ) {
    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              [field]: stage[field].map((variant) =>
                variant.id === variantId ? { ...variant, value } : variant,
              ),
            }
          : stage,
      ),
    );
  }

  function addStage() {
    const next = createStage(stages.length);
    setStages((current) => [...current, next]);
    choosePreviewStage(next.id);
  }

  function removeStage(id: number) {
    setStages((current) => {
      const next = current.filter((stage) => stage.id !== id);
      if (previewStageId === id && next[0]) {
        setPreviewStageId(next[0].id);
        setPreviewSubjectIndex(0);
        setPreviewBodyIndex(0);
      }
      return next.length ? next : current;
    });
  }

  function addVariant(stageId: number, field: "subjectVariants" | "bodyVariants") {
    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              [field]: [
                ...stage[field],
                createVariant(
                  field === "subjectVariants"
                    ? "Alternative subject for {NORMALISED_COMPANY}"
                    : "Alternative body variant for {FIRST_NAME}.",
                ),
              ],
            }
          : stage,
      ),
    );
  }

  function removeVariant(
    stageId: number,
    field: "subjectVariants" | "bodyVariants",
    variantId: number,
  ) {
    setStages((current) =>
      current.map((stage) => {
        if (stage.id !== stageId || stage[field].length === 1) return stage;
        return {
          ...stage,
          [field]: stage[field].filter((variant) => variant.id !== variantId),
        };
      }),
    );
  }

  function appendVariable(
    stageId: number,
    field: "subjectVariants" | "bodyVariants",
    variantId: number,
    token: string,
  ) {
    setStages((current) =>
      current.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          [field]: stage[field].map((variant) =>
            variant.id === variantId
              ? {
                  ...variant,
                  value: variant.value ? `${variant.value} ${token}` : token,
                }
              : variant,
          ),
        };
      }),
    );
  }

  function choosePreviewStage(id: number) {
    setPreviewStageId(id);
    setPreviewSubjectIndex(0);
    setPreviewBodyIndex(0);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const steps = stages
      .map((stage, index) => ({
        name: stage.name.trim() || `Stage ${index + 1}`,
        delayDays: stage.delayDays,
        subjectVariants: variantValues(stage.subjectVariants),
        bodyVariants: variantValues(stage.bodyVariants),
      }))
      .filter((step) => step.subjectVariants.length && step.bodyVariants.length);

    if (steps.length === 0) {
      setError("Add at least one stage with subject and body variants.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(
        isEditing ? `/api/campaigns/${initialCampaign?.id}` : "/api/campaigns",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            goal: form.get("goal"),
            serviceOffer: form.get("serviceOffer"),
            status: "draft",
            steps,
          }),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? `Could not ${isEditing ? "update" : "create"} campaign.`);
        return;
      }

      if (!isEditing) {
        formElement.reset();
        const resetStages = [createStage(0), createStage(1)];
        setStages(resetStages);
        choosePreviewStage(resetStages[0].id);
      }

      router.refresh();
      router.push(isEditing ? `/campaigns/${initialCampaign?.id}` : "/campaigns");
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" required defaultValue={initialCampaign?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceOffer">Service offered</Label>
          <Input
            id="serviceOffer"
            name="serviceOffer"
            placeholder="AI automation audit"
            defaultValue={initialCampaign?.serviceOffer}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal">Goal</Label>
        <Input
          id="goal"
          name="goal"
          placeholder="Book qualified discovery calls"
          defaultValue={initialCampaign?.goal}
        />
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Available variables</p>
            <p className="text-xs text-muted-foreground">
              Insert these into a specific subject or body variant.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Spintax is supported: <code>{`{{RANDOM | Hey | Hi | Hello}}`}</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {personalisationVariables.map((variable) => (
              <code
                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                key={variable.token}
              >
                {variable.token}
              </code>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Campaign stages</h2>
          <Button onClick={addStage} type="button" variant="secondary">
            <Plus aria-hidden className="h-4 w-4" />
            Add stage
          </Button>
        </div>

        {stages.map((stage, index) => {
          const subjectCount = variantValues(stage.subjectVariants).length;
          const bodyCount = variantValues(stage.bodyVariants).length;

          return (
            <div className="rounded-md border border-border p-4" key={stage.id}>
              <div className="mb-3 grid gap-3 md:grid-cols-[1fr_140px_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor={`stage-${stage.id}-name`}>
                    Stage {index + 1} name
                  </Label>
                  <Input
                    id={`stage-${stage.id}-name`}
                    value={stage.name}
                    onChange={(event) =>
                      updateStage(stage.id, { name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`stage-${stage.id}-delay`}>Delay days</Label>
                  <Input
                    id={`stage-${stage.id}-delay`}
                    min={0}
                    type="number"
                    value={stage.delayDays}
                    onChange={(event) =>
                      updateStage(stage.id, {
                        delayDays: Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => choosePreviewStage(stage.id)}
                    type="button"
                    variant={previewStageId === stage.id ? "primary" : "secondary"}
                  >
                    <Eye aria-hidden className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    aria-label={`Remove stage ${index + 1}`}
                    disabled={stages.length === 1}
                    onClick={() => removeStage(stage.id)}
                    type="button"
                    variant="secondary"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-muted p-3">
                  <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                    <Split aria-hidden className="h-3.5 w-3.5" />
                    A/B status
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {subjectCount > 1 || bodyCount > 1
                      ? "Testing enabled"
                      : "Single variant"}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs uppercase text-muted-foreground">Subjects</p>
                  <p className="mt-1 text-sm font-medium">{subjectCount} variants</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs uppercase text-muted-foreground">Bodies</p>
                  <p className="mt-1 text-sm font-medium">{bodyCount} variants</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Subject variants</Label>
                    <Button
                      onClick={() => addVariant(stage.id, "subjectVariants")}
                      type="button"
                      variant="secondary"
                    >
                      <Plus aria-hidden className="h-4 w-4" />
                      Add subject
                    </Button>
                  </div>

                  {stage.subjectVariants.map((variant, variantIndex) => (
                    <div
                      className="space-y-2 rounded-md border border-border p-3"
                      key={variant.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor={`stage-${stage.id}-subject-${variant.id}`}>
                          Subject {String.fromCharCode(65 + variantIndex)}
                        </Label>
                        <Button
                          aria-label={`Remove subject variant ${variantIndex + 1}`}
                          disabled={stage.subjectVariants.length === 1}
                          onClick={() =>
                            removeVariant(stage.id, "subjectVariants", variant.id)
                          }
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        id={`stage-${stage.id}-subject-${variant.id}`}
                        placeholder="Short {MAGNET_NAME} for {NORMALISED_COMPANY}"
                        value={variant.value}
                        onChange={(event) =>
                          updateVariant(
                            stage.id,
                            "subjectVariants",
                            variant.id,
                            event.target.value,
                          )
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        {personalisationVariables.map((variable) => (
                          <Button
                            className="h-8 px-2 text-xs"
                            key={variable.token}
                            onClick={() =>
                              appendVariable(
                                stage.id,
                                "subjectVariants",
                                variant.id,
                                variable.token,
                              )
                            }
                            type="button"
                            variant="secondary"
                          >
                            {variable.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Body variants</Label>
                    <Button
                      onClick={() => addVariant(stage.id, "bodyVariants")}
                      type="button"
                      variant="secondary"
                    >
                      <Plus aria-hidden className="h-4 w-4" />
                      Add body
                    </Button>
                  </div>

                  {stage.bodyVariants.map((variant, variantIndex) => (
                    <div
                      className="space-y-2 rounded-md border border-border p-3"
                      key={variant.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor={`stage-${stage.id}-body-${variant.id}`}>
                          Body {String.fromCharCode(65 + variantIndex)}
                        </Label>
                        <Button
                          aria-label={`Remove body variant ${variantIndex + 1}`}
                          disabled={stage.bodyVariants.length === 1}
                          onClick={() =>
                            removeVariant(stage.id, "bodyVariants", variant.id)
                          }
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        className="min-h-72"
                        id={`stage-${stage.id}-body-${variant.id}`}
                        placeholder="Hi {FIRST_NAME}, noticed {NORMALISED_COMPANY}..."
                        value={variant.value}
                        onChange={(event) =>
                          updateVariant(
                            stage.id,
                            "bodyVariants",
                            variant.id,
                            event.target.value,
                          )
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        {personalisationVariables.map((variable) => (
                          <Button
                            className="h-8 px-2 text-xs"
                            key={variable.token}
                            onClick={() =>
                              appendVariable(
                                stage.id,
                                "bodyVariants",
                                variant.id,
                                variable.token,
                              )
                            }
                            type="button"
                            variant="secondary"
                          >
                            {variable.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Eye aria-hidden className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Test email preview</p>
        </div>
        <div className="space-y-3 overflow-visible rounded-md bg-muted p-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Stage</p>
            <p className="text-sm font-medium">{previewStage?.name ?? "Stage 1"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Subject</p>
            {previewSubjectVariants.length > 1 ? (
              <div className="my-2 flex flex-wrap gap-2">
                {previewSubjectVariants.map((_variant, index) => (
                  <Button
                    key={`subject-${index}`}
                    onClick={() => setPreviewSubjectIndex(index)}
                    type="button"
                    variant={previewSubjectIndex === index ? "primary" : "secondary"}
                  >
                    Subject {String.fromCharCode(65 + index)}
                  </Button>
                ))}
              </div>
            ) : null}
            <p className="break-words text-sm font-medium">
              {applyPersonalisation(
                renderSpintax(previewSubject, `${previewStage?.id}:subject`),
                sampleLead,
              )}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Body</p>
            {previewBodyVariants.length > 1 ? (
              <div className="my-2 flex flex-wrap gap-2">
                {previewBodyVariants.map((_variant, index) => (
                  <Button
                    key={`body-${index}`}
                    onClick={() => setPreviewBodyIndex(index)}
                    type="button"
                    variant={previewBodyIndex === index ? "primary" : "secondary"}
                  >
                    Body {String.fromCharCode(65 + index)}
                  </Button>
                ))}
              </div>
            ) : null}
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {applyPersonalisation(
                renderSpintax(previewBody, `${previewStage?.id}:body`),
                sampleLead,
              )}
            </p>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending
          ? isEditing
            ? "Saving..."
            : "Creating..."
          : isEditing
            ? "Save draft campaign"
            : "Create draft campaign"}
      </Button>
    </form>
  );
}
