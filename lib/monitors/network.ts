import { prisma } from "@/lib/prisma";

/**
 * Record a network signal: someone moved jobs or is hiring.
 * Creates/updates company + person, and emits an alert.
 */
export async function recordNetworkSignal(input: {
  personName: string;
  personId?: string;
  companyName: string;
  newTitle?: string;
  signalType: "job_change" | "hiring";
  notes?: string;
  careersUrl?: string;
}) {
  let company = await prisma.company.findFirst({
    where: { name: { equals: input.companyName, mode: "insensitive" } },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: input.companyName,
        source: "network",
        status: "watching",
        whyInteresting: `Surfaced via network signal (${input.signalType}) from ${input.personName}`,
        careersUrl: input.careersUrl || null,
        approvedAt: new Date(),
      },
    });
  }

  let person =
    (input.personId
      ? await prisma.person.findUnique({ where: { id: input.personId } })
      : await prisma.person.findFirst({
          where: { name: { equals: input.personName, mode: "insensitive" } },
        })) ?? null;

  if (!person) {
    person = await prisma.person.create({
      data: {
        name: input.personName,
        companyId: company.id,
        currentTitle: input.newTitle || null,
        relationshipStrength: "know",
        hooks: "Stanford / personal network",
        researchNotes: input.notes || null,
      },
    });
  } else {
    person = await prisma.person.update({
      where: { id: person.id },
      data: {
        companyId: company.id,
        currentTitle: input.newTitle || person.currentTitle,
        researchNotes: [person.researchNotes, input.notes].filter(Boolean).join("\n"),
      },
    });
  }

  let opportunityId: string | undefined;
  if (input.signalType === "hiring") {
    const opportunity = await prisma.opportunity.create({
      data: {
        title: input.newTitle ? `Hiring / ${input.newTitle}` : "Hiring (network signal)",
        companyId: company.id,
        type: "upcoming_hire",
        source: "network_signal",
        status: "new",
        warmPersonId: person.id,
        whyFit: input.notes || "Surfaced through Stanford/network contact",
      },
    });
    opportunityId = opportunity.id;
  }

  const alert = await prisma.alert.create({
    data: {
      type: "network_move",
      title:
        input.signalType === "hiring"
          ? `${input.personName} flagged hiring at ${company.name}`
          : `${input.personName} joined ${company.name}`,
      body: input.notes || input.newTitle || null,
      companyId: company.id,
      personId: person.id,
      opportunityId,
    },
  });

  return { company, person, alert, opportunityId };
}

export async function syncFollowUpAlerts() {
  const now = new Date();
  const due = await prisma.person.findMany({
    where: { nextFollowUpAt: { lte: now } },
  });

  let created = 0;
  for (const person of due) {
    const existing = await prisma.alert.findFirst({
      where: {
        personId: person.id,
        type: "follow_up_due",
        dismissedAt: null,
      },
    });
    if (existing) continue;
    await prisma.alert.create({
      data: {
        type: "follow_up_due",
        title: `Follow up with ${person.name}`,
        body: person.nextFollowUpAt?.toISOString() ?? null,
        personId: person.id,
        companyId: person.companyId,
      },
    });
    created += 1;
  }
  return { created, due: due.length };
}
