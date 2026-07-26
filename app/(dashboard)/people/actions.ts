"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { emptyToNull, interactionSchema, personSchema } from "@/lib/validators";
import { parsePeopleCsv } from "@/lib/csv";

export async function createPerson(formData: FormData) {
  const parsed = personSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    linkedinUrl: formData.get("linkedinUrl"),
    currentTitle: formData.get("currentTitle"),
    companyId: formData.get("companyId") || null,
    relationshipStrength: formData.get("relationshipStrength") || "cold",
    hooks: formData.get("hooks"),
    researchNotes: formData.get("researchNotes"),
    nextFollowUpAt: formData.get("nextFollowUpAt"),
  });

  const person = await prisma.person.create({
    data: {
      name: parsed.name,
      email: emptyToNull(parsed.email),
      linkedinUrl: emptyToNull(parsed.linkedinUrl),
      currentTitle: emptyToNull(parsed.currentTitle),
      companyId: emptyToNull(parsed.companyId),
      relationshipStrength: parsed.relationshipStrength,
      hooks: emptyToNull(parsed.hooks),
      researchNotes: emptyToNull(parsed.researchNotes),
      nextFollowUpAt: parsed.nextFollowUpAt ? new Date(parsed.nextFollowUpAt) : null,
    },
  });

  revalidatePath("/people");
  redirect(`/people/${person.id}`);
}

export async function updatePerson(id: string, formData: FormData) {
  const parsed = personSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    linkedinUrl: formData.get("linkedinUrl"),
    currentTitle: formData.get("currentTitle"),
    companyId: formData.get("companyId") || null,
    relationshipStrength: formData.get("relationshipStrength") || "cold",
    hooks: formData.get("hooks"),
    researchNotes: formData.get("researchNotes"),
    nextFollowUpAt: formData.get("nextFollowUpAt"),
  });

  await prisma.person.update({
    where: { id },
    data: {
      name: parsed.name,
      email: emptyToNull(parsed.email),
      linkedinUrl: emptyToNull(parsed.linkedinUrl),
      currentTitle: emptyToNull(parsed.currentTitle),
      companyId: emptyToNull(parsed.companyId),
      relationshipStrength: parsed.relationshipStrength,
      hooks: emptyToNull(parsed.hooks),
      researchNotes: emptyToNull(parsed.researchNotes),
      nextFollowUpAt: parsed.nextFollowUpAt ? new Date(parsed.nextFollowUpAt) : null,
    },
  });

  revalidatePath(`/people/${id}`);
  revalidatePath("/people");
  revalidatePath("/home");
  redirect(`/people/${id}`);
}

export async function logInteraction(formData: FormData) {
  const parsed = interactionSchema.parse({
    personId: formData.get("personId") || null,
    opportunityId: formData.get("opportunityId") || null,
    channel: formData.get("channel") || "email",
    direction: formData.get("direction") || "note",
    summary: formData.get("summary"),
    body: formData.get("body"),
    nextStep: formData.get("nextStep"),
    nextFollowUpAt: formData.get("nextFollowUpAt"),
  });

  await prisma.interaction.create({
    data: {
      personId: emptyToNull(parsed.personId),
      opportunityId: emptyToNull(parsed.opportunityId),
      channel: parsed.channel,
      direction: parsed.direction,
      summary: parsed.summary,
      body: emptyToNull(parsed.body),
      nextStep: emptyToNull(parsed.nextStep),
    },
  });

  if (parsed.personId) {
    await prisma.person.update({
      where: { id: parsed.personId },
      data: {
        lastContactAt: new Date(),
        nextFollowUpAt: parsed.nextFollowUpAt ? new Date(parsed.nextFollowUpAt) : undefined,
      },
    });
    revalidatePath(`/people/${parsed.personId}`);
  }
  if (parsed.opportunityId) {
    revalidatePath(`/opportunities/${parsed.opportunityId}`);
  }
  revalidatePath("/home");
}

export async function importPeopleCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("CSV file required");
  }
  const text = await file.text();
  const { rows, errors } = parsePeopleCsv(text);

  let created = 0;
  for (const row of rows) {
    let companyId: string | null = null;
    if (row.companyName.trim()) {
      const existing = await prisma.company.findFirst({
        where: { name: { equals: row.companyName.trim(), mode: "insensitive" } },
      });
      if (existing) {
        companyId = existing.id;
      } else {
        const company = await prisma.company.create({
          data: {
            name: row.companyName.trim(),
            source: "network",
            status: "watching",
            whyInteresting: "Imported via Stanford/network CSV",
            approvedAt: new Date(),
          },
        });
        companyId = company.id;
      }
    }

    await prisma.person.create({
      data: {
        name: row.name,
        email: row.email || null,
        linkedinUrl: row.linkedinUrl || null,
        currentTitle: row.currentTitle || null,
        companyId,
        relationshipStrength: row.relationshipStrength,
        hooks: row.hooks || null,
      },
    });
    created += 1;
  }

  revalidatePath("/people");
  revalidatePath("/companies");
  return { created, skippedErrors: errors };
}
