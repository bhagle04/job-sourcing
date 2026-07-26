import Papa from "papaparse";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional().default(""),
  linkedinUrl: z.string().optional().default(""),
  currentTitle: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
  relationshipStrength: z.enum(["know", "warm", "cold"]).optional().default("cold"),
  hooks: z.string().optional().default(""),
});

export type ParsedPersonRow = z.infer<typeof rowSchema>;

export type ParsePeopleCsvResult = {
  rows: ParsedPersonRow[];
  errors: string[];
};

export function parsePeopleCsv(text: string): ParsePeopleCsvResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors: string[] = [...(parsed.errors.map((e) => e.message) ?? [])];
  const rows: ParsedPersonRow[] = [];

  parsed.data.forEach((raw, index) => {
    const normalized = {
      name: raw.name ?? raw.Name ?? "",
      email: raw.email ?? raw.Email ?? "",
      linkedinUrl: raw.linkedinUrl ?? raw.linkedin ?? raw.LinkedIn ?? "",
      currentTitle: raw.currentTitle ?? raw.title ?? raw.Title ?? "",
      companyName: raw.companyName ?? raw.company ?? raw.Company ?? "",
      relationshipStrength: (raw.relationshipStrength ?? raw.relationship ?? "cold").toLowerCase(),
      hooks: raw.hooks ?? raw.Hooks ?? "",
    };

    const result = rowSchema.safeParse(normalized);
    if (!result.success) {
      errors.push(`Row ${index + 2}: ${result.error.issues.map((i) => i.message).join(", ")}`);
      return;
    }
    rows.push(result.data);
  });

  return { rows, errors };
}

const companyRowSchema = z.object({
  name: z.string().min(1),
  stage: z.string().optional().default(""),
  sectors: z.array(z.string()).default([]),
  careersUrl: z.string().optional().default(""),
  websiteUrl: z.string().optional().default(""),
  whyInteresting: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  status: z.enum(["watching", "active", "parked"]).default("watching"),
});

export type ParsedCompanyRow = z.infer<typeof companyRowSchema>;

export type ParseCompaniesCsvResult = {
  rows: ParsedCompanyRow[];
  errors: string[];
};

function pickField(raw: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  // case-insensitive fallback
  const lowerMap = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of keys) {
    const value = lowerMap[key.toLowerCase()];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function splitSectors(value: string) {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCompaniesCsv(text: string): ParseCompaniesCsvResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors: string[] = [...(parsed.errors.map((e) => e.message) ?? [])];
  const rows: ParsedCompanyRow[] = [];

  parsed.data.forEach((raw, index) => {
    const statusRaw = pickField(raw, ["status", "Status"]).toLowerCase() || "watching";
    const normalized = {
      name: pickField(raw, ["name", "company", "Name", "Company"]),
      stage: pickField(raw, ["stage", "Stage"]),
      sectors: splitSectors(pickField(raw, ["sectors", "sector", "Sectors", "Sector"])),
      careersUrl: pickField(raw, ["careersUrl", "careers", "Careers", "careers_url"]),
      websiteUrl: pickField(raw, ["websiteUrl", "website", "url", "Website", "URL"]),
      whyInteresting: pickField(raw, ["whyInteresting", "why", "Why", "why_interesting"]),
      notes: pickField(raw, ["notes", "Notes"]),
      status: statusRaw,
    };

    const result = companyRowSchema.safeParse(normalized);
    if (!result.success) {
      errors.push(`Row ${index + 2}: ${result.error.issues.map((i) => i.message).join(", ")}`);
      return;
    }
    rows.push(result.data);
  });

  return { rows, errors };
}
