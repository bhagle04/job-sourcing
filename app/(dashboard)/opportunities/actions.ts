"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withSaved } from "@/lib/flash";
import { emptyToNull, opportunitySchema } from "@/lib/validators";

export async function createOpportunity(formData: FormData) {
  const parsed = opportunitySchema.parse({
    title: formData.get("title"),
    companyId: formData.get("companyId"),
    url: formData.get("url"),
    source: formData.get("source"),
    type: formData.get("type") || "job_post",
    status: formData.get("status") || "new",
    fitScore: formData.get("fitScore") || null,
    whyFit: formData.get("whyFit"),
    talkingPoints: formData.get("talkingPoints"),
    questionsToAsk: formData.get("questionsToAsk"),
    compensationNotes: formData.get("compensationNotes"),
    warmPersonId: formData.get("warmPersonId") || null,
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      title: parsed.title,
      companyId: parsed.companyId,
      url: emptyToNull(parsed.url),
      source: emptyToNull(parsed.source),
      type: parsed.type,
      status: parsed.status,
      fitScore: parsed.fitScore ?? null,
      whyFit: emptyToNull(parsed.whyFit),
      talkingPoints: emptyToNull(parsed.talkingPoints),
      questionsToAsk: emptyToNull(parsed.questionsToAsk),
      compensationNotes: emptyToNull(parsed.compensationNotes),
      warmPersonId: emptyToNull(parsed.warmPersonId),
    },
  });

  revalidatePath("/opportunities");
  redirect(withSaved(`/opportunities/${opportunity.id}`));
}

export async function updateOpportunity(id: string, formData: FormData) {
  const parsed = opportunitySchema.parse({
    title: formData.get("title"),
    companyId: formData.get("companyId"),
    url: formData.get("url"),
    source: formData.get("source"),
    type: formData.get("type") || "job_post",
    status: formData.get("status") || "new",
    fitScore: formData.get("fitScore") || null,
    whyFit: formData.get("whyFit"),
    talkingPoints: formData.get("talkingPoints"),
    questionsToAsk: formData.get("questionsToAsk"),
    compensationNotes: formData.get("compensationNotes"),
    warmPersonId: formData.get("warmPersonId") || null,
  });

  await prisma.opportunity.update({
    where: { id },
    data: {
      title: parsed.title,
      companyId: parsed.companyId,
      url: emptyToNull(parsed.url),
      source: emptyToNull(parsed.source),
      type: parsed.type,
      status: parsed.status,
      fitScore: parsed.fitScore ?? null,
      whyFit: emptyToNull(parsed.whyFit),
      talkingPoints: emptyToNull(parsed.talkingPoints),
      questionsToAsk: emptyToNull(parsed.questionsToAsk),
      compensationNotes: emptyToNull(parsed.compensationNotes),
      warmPersonId: emptyToNull(parsed.warmPersonId),
    },
  });

  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/opportunities");
  revalidatePath("/home");
  redirect(withSaved(`/opportunities/${id}`));
}
