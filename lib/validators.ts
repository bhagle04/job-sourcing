import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1),
  stage: z.string().optional().nullable(),
  sectors: z.string().optional().nullable(), // comma-separated from forms
  careersUrl: z.string().url().optional().or(z.literal("")).nullable(),
  websiteUrl: z.string().url().optional().or(z.literal("")).nullable(),
  source: z.enum(["seeded", "network", "suggested"]).default("seeded"),
  status: z.enum(["watching", "active", "parked"]).default("watching"),
  whyInteresting: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const personSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  linkedinUrl: z.string().url().optional().or(z.literal("")).nullable(),
  currentTitle: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  relationshipStrength: z.enum(["know", "warm", "cold"]).default("cold"),
  hooks: z.string().optional().nullable(),
  researchNotes: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
});

export const opportunitySchema = z.object({
  title: z.string().min(1),
  companyId: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  source: z.string().optional().nullable(),
  type: z.enum(["job_post", "intro_path", "upcoming_hire", "other"]).default("job_post"),
  status: z.enum(["new", "interested", "applied", "closed"]).default("new"),
  fitScore: z.coerce.number().int().min(0).max(100).optional().nullable(),
  whyFit: z.string().optional().nullable(),
  talkingPoints: z.string().optional().nullable(),
  questionsToAsk: z.string().optional().nullable(),
  compensationNotes: z.string().optional().nullable(),
  warmPersonId: z.string().optional().nullable(),
});

export const interactionSchema = z.object({
  personId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  channel: z.enum(["email", "linkedin", "call", "other"]).default("email"),
  direction: z.enum(["outbound", "inbound", "note"]).default("note"),
  summary: z.string().min(1),
  body: z.string().optional().nullable(),
  nextStep: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
});

export const profileSchema = z.object({
  backgroundSummary: z.string().min(1),
  targetSectors: z.string().optional().nullable(),
  thesis: z.string().optional().nullable(),
  targetCompMin: z.coerce.number().int().optional().nullable(),
  targetCompMax: z.coerce.number().int().optional().nullable(),
  voiceSamples: z.string().optional().nullable(),
});

export function parseSectors(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  return value.trim();
}
