import { describe, expect, it } from "vitest";
import {
  onboardingTaskInputSchema,
  pdfExportInputSchema,
  portalAccessInputSchema,
  publicSignatureSchema,
  signatureRequestInputSchema,
} from "@/validation/portal";

const clientId = "665f2d3fc7953f6e91c80a11";
const proposalId = "665f2d3fc7953f6e91c80a12";

describe("portal validation", () => {
  it("validates portal access input", () => {
    const result = portalAccessInputSchema.parse({
      clientId,
      label: "Board portal",
      expiresAt: "2026-07-01",
    });

    expect(result.label).toBe("Board portal");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("defaults onboarding and signature statuses", () => {
    const task = onboardingTaskInputSchema.parse({
      clientId,
      title: "Upload brand assets",
    });
    const signature = signatureRequestInputSchema.parse({
      clientId,
      proposalId,
      title: "Approve proposal",
      signerName: "Grace Hopper",
      signerEmail: "grace@example.com",
      termsMarkdown: "Approved.",
    });

    expect(task.status).toBe("pending");
    expect(signature.status).toBe("sent");
  });

  it("validates public signatures and PDF exports", () => {
    const signature = publicSignatureSchema.parse({
      signerName: "Grace Hopper",
      signatureText: "Grace Hopper",
    });
    const pdfExport = pdfExportInputSchema.parse({
      clientId,
      proposalId,
      title: "Proposal PDF",
    });

    expect(signature.signatureText).toBe("Grace Hopper");
    expect(pdfExport.title).toBe("Proposal PDF");
  });
});
