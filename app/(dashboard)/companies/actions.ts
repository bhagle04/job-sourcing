"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseCompaniesCsv } from "@/lib/csv";
import { companySchema, emptyToNull, parseSectors } from "@/lib/validators";

export async function createCompany(formData: FormData) {
  const parsed = companySchema.parse({
    name: formData.get("name"),
    stage: formData.get("stage"),
    sectors: formData.get("sectors"),
    careersUrl: formData.get("careersUrl"),
    websiteUrl: formData.get("websiteUrl"),
    source: formData.get("source") || "seeded",
    status: formData.get("status") || "watching",
    whyInteresting: formData.get("whyInteresting"),
    notes: formData.get("notes"),
  });

  const company = await prisma.company.create({
    data: {
      name: parsed.name,
      stage: emptyToNull(parsed.stage),
      sectors: parseSectors(parsed.sectors),
      careersUrl: emptyToNull(parsed.careersUrl),
      websiteUrl: emptyToNull(parsed.websiteUrl),
      source: parsed.source,
      status: parsed.status,
      whyInteresting: emptyToNull(parsed.whyInteresting),
      notes: emptyToNull(parsed.notes),
      approvedAt: parsed.source === "suggested" ? null : new Date(),
    },
  });

  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(id: string, formData: FormData) {
  const parsed = companySchema.parse({
    name: formData.get("name"),
    stage: formData.get("stage"),
    sectors: formData.get("sectors"),
    careersUrl: formData.get("careersUrl"),
    websiteUrl: formData.get("websiteUrl"),
    source: formData.get("source") || "seeded",
    status: formData.get("status") || "watching",
    whyInteresting: formData.get("whyInteresting"),
    notes: formData.get("notes"),
  });

  await prisma.company.update({
    where: { id },
    data: {
      name: parsed.name,
      stage: emptyToNull(parsed.stage),
      sectors: parseSectors(parsed.sectors),
      careersUrl: emptyToNull(parsed.careersUrl),
      websiteUrl: emptyToNull(parsed.websiteUrl),
      source: parsed.source,
      status: parsed.status,
      whyInteresting: emptyToNull(parsed.whyInteresting),
      notes: emptyToNull(parsed.notes),
    },
  });

  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
  redirect(`/companies/${id}`);
}

export async function approveSuggestedCompany(id: string) {
  await prisma.company.update({
    where: { id },
    data: {
      status: "watching",
      source: "suggested",
      approvedAt: new Date(),
    },
  });
  await prisma.alert.updateMany({
    where: { companyId: id, type: "suggestion", dismissedAt: null },
    data: { dismissedAt: new Date() },
  });
  revalidatePath("/companies");
  revalidatePath("/home");
  redirect(`/companies/${id}`);
}

export async function rejectSuggestedCompany(id: string) {
  await prisma.alert.updateMany({
    where: { companyId: id, type: "suggestion", dismissedAt: null },
    data: { dismissedAt: new Date() },
  });
  await prisma.company.update({
    where: { id },
    data: { status: "parked" },
  });
  revalidatePath("/companies");
  revalidatePath("/home");
}

export async function importCompaniesCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("CSV file required");
  }
  const text = await file.text();
  const { rows, errors } = parseCompaniesCsv(text);

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = await prisma.company.findFirst({
      where: { name: { equals: row.name, mode: "insensitive" } },
    });

    const data = {
      name: row.name,
      stage: row.stage || null,
      sectors: row.sectors,
      careersUrl: row.careersUrl || null,
      websiteUrl: row.websiteUrl || null,
      whyInteresting: row.whyInteresting || null,
      notes: row.notes || null,
      status: row.status,
    };

    if (existing) {
      await prisma.company.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
    } else {
      await prisma.company.create({
        data: {
          ...data,
          source: "seeded",
          approvedAt: new Date(),
        },
      });
      created += 1;
    }
  }

  revalidatePath("/companies");
  return { created, updated, skippedErrors: errors };
}
