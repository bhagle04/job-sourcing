import { describe, expect, it } from "vitest";
import { parseCompaniesCsv, parsePeopleCsv } from "@/lib/csv";
import { withSaved } from "@/lib/flash";
import { extractJobsFromCareersHtml } from "@/lib/monitors/careers";

describe("withSaved", () => {
  it("appends saved query and preserves existing params", () => {
    expect(withSaved("/profile")).toBe("/profile?saved=Saved");
    expect(withSaved("/companies?source=suggested")).toBe(
      "/companies?source=suggested&saved=Saved",
    );
  });
});

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

describe("parseCompaniesCsv", () => {
  it("parses aliases, splits sectors, defaults status", () => {
    const csv = `company,stage,sector,website,careers,why,status
Acme Robotics,Series A,"hard-tech, AI",https://acme.com,https://acme.com/jobs,Cool mech,active
`;
    const result = parseCompaniesCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("Acme Robotics");
    expect(result.rows[0].sectors).toEqual(["hard-tech", "AI"]);
    expect(result.rows[0].websiteUrl).toBe("https://acme.com");
    expect(result.rows[0].careersUrl).toBe("https://acme.com/jobs");
    expect(result.rows[0].status).toBe("active");
  });

  it("errors on missing name and invalid status", () => {
    const csv = `name,status
,watching
Beta,nope`;
    const result = parseCompaniesCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
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
