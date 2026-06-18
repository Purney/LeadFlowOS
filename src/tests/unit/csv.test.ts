import { describe, expect, it } from "vitest";
import { parseCsv } from "@/utils/csv";
import { findDuplicateEmails, parseLeadCsv } from "@/utils/lead-import";

describe("CSV parsing", () => {
  it("parses quoted CSV fields", () => {
    const rows = parseCsv('firstName,email,notes\nAda,ada@example.com,"AI, automation"');

    expect(rows).toEqual([
      {
        firstname: "Ada",
        email: "ada@example.com",
        notes: "AI, automation",
      },
    ]);
  });

  it("maps CSV rows into imported leads", () => {
    const leads = parseLeadCsv(
      "firstName,lastName,email,company,tags,projecttype\nAda,Lovelace,ada@example.com,Engines,ai;automation,Healthcare",
      "Apollo",
    );

    expect(leads[0]).toMatchObject({
      email: "ada@example.com",
      source: "Apollo",
      status: "imported",
      tags: ["ai", "automation"],
      customFields: { projecttype: "Healthcare" },
    });
  });
});

describe("duplicate detection", () => {
  it("detects duplicate emails within an import", () => {
    const duplicates = findDuplicateEmails([
      { email: "ada@example.com" },
      { email: "grace@example.com" },
      { email: "ADA@example.com" },
    ]);

    expect(duplicates).toEqual(["ada@example.com"]);
  });
});
