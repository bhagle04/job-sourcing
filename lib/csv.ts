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
