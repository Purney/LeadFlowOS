import { describe, expect, it } from "vitest";
import {
  applyPersonalisation,
  extractPersonalisationVariables,
} from "@/utils/personalisation";

describe("personalisation", () => {
  it("replaces supported placeholders", () => {
    const result = applyPersonalisation(
      "Hi {{firstName}}, is {{company}} still using {{website}}?",
      {
        firstName: "Ada",
        company: "Analytical Engines Ltd",
        website: "https://example.com",
      },
    );

    expect(result).toBe(
      "Hi Ada, is Analytical Engines Ltd still using https://example.com?",
    );
  });

  it("extracts variables from templates", () => {
    expect(
      extractPersonalisationVariables("{{firstName}} at {{ company }}"),
    ).toEqual(["firstName", "company"]);
  });

  it("supports outreach research placeholders", () => {
    const result = applyPersonalisation(
      "Hey {FIRST_NAME}, saw {SPECIFIC_DATA_POINT} about {NORMALISED_COMPANY}. {SENDER_EMAIL_SIGNATURE}",
      {
        firstName: "Grace",
        specificDataPoint: "your drawing team is hiring",
        normalisedCompany: "Compiler Labs",
        senderEmailSignature: "Best,\nAlex",
      },
    );

    expect(result).toBe(
      "Hey Grace, saw your drawing team is hiring about Compiler Labs. Best,\nAlex",
    );
    expect(extractPersonalisationVariables(result)).toEqual([]);
  });

  it("replaces placeholders from custom lead fields", () => {
    const result = applyPersonalisation(
      "Relevant for {PROJECT_TYPE} teams working on {BID_STAGE}.",
      {
        customFields: {
          "Project Type": "healthcare refurbishment",
          "Bid stage": "preconstruction",
        },
      },
    );

    expect(result).toBe(
      "Relevant for healthcare refurbishment teams working on preconstruction.",
    );
  });
});
