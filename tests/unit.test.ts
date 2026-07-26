import { describe, expect, it } from "vitest";
import { parsePeopleCsv } from "@/lib/csv";
import { extractJobsFromCareersHtml } from "@/lib/monitors/careers";

describe("parsePeopleCsv", () => {
  it("parses valid rows and reports bad ones", () => {
    const csv = `name,email,companyName,relationshipStrength,hooks
Alex Alumni,alex@example.com,Acme,know,Stanford
,bad@example.com,Acme,cold,missing name`;
    const result = parsePeopleCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("Alex Alumni");
    expect(result.rows[0].relationshipStrength).toBe("know");
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("extractJobsFromCareersHtml", () => {
  it("extracts greenhouse job links", () => {
    const html = `
      <a href="https://boards.greenhouse.io/acme/jobs/12345">Software Engineer</a>
      <a href="https://boards.greenhouse.io/acme/jobs/12345">Software Engineer</a>
    `;
    const jobs = extractJobsFromCareersHtml(html, "https://boards.greenhouse.io/acme");
    expect(jobs).toHaveLength(1);
    expect(jobs[0].externalId).toBe("gh-12345");
    expect(jobs[0].title).toBe("Software Engineer");
  });
});
