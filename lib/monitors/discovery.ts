import { prisma } from "@/lib/prisma";

export type DiscoveryCandidate = {
  name: string;
  stage?: string;
  sectors: string[];
  whyInteresting: string;
  websiteUrl?: string;
  careersUrl?: string;
  sourceDetail: string;
};

/**
 * Suggest startups from thesis keywords + existing network graph.
 * Creates Company rows with source=suggested and approval required (approvedAt null).
 */
export async function suggestStartups(query: string) {
  const profile = await prisma.profile.findFirst();
  const thesis = query || profile?.thesis || profile?.targetSectors.join(", ") || "hard-tech AI defense";

  const networkCompanies = await prisma.company.findMany({
    where: { source: "network", status: { in: ["watching", "active"] } },
    include: { people: { where: { relationshipStrength: { in: ["know", "warm"] } }, take: 3 } },
    take: 20,
  });

  const candidates: DiscoveryCandidate[] = [];

  // Network-adjacent suggestions: promote related notes into explicit suggestions
  for (const company of networkCompanies) {
    if (company.people.length === 0) continue;
    candidates.push({
      name: company.name,
      stage: company.stage ?? undefined,
      sectors: company.sectors,
      whyInteresting:
        company.whyInteresting ||
        `Already in your network via ${company.people.map((p) => p.name).join(", ")}`,
      websiteUrl: company.websiteUrl ?? undefined,
      careersUrl: company.careersUrl ?? undefined,
      sourceDetail: "network_graph",
    });
  }

  // Lightweight thesis-driven placeholders the user can edit/approve.
  // In production this would call a funding/news API; here we synthesize actionable suggestions
  // grounded in the user's sectors so the approval loop works end-to-end.
  const sectors = profile?.targetSectors?.length
    ? profile.targetSectors
    : thesis.split(/[,\s]+/).filter(Boolean).slice(0, 4);

  for (const sector of sectors.slice(0, 3)) {
    candidates.push({
      name: `${sector} startup (review)`,
      stage: "Seed–Series A",
      sectors: [sector],
      whyInteresting: `Matches thesis (“${thesis}”). Replace with a real company from funding news, YC, or a Stanford contact, then approve.`,
      sourceDetail: `thesis:${sector}`,
    });
  }

  const created = [];
  for (const candidate of candidates) {
    const existing = await prisma.company.findFirst({
      where: { name: { equals: candidate.name, mode: "insensitive" } },
    });
    if (existing) continue;

    const company = await prisma.company.create({
      data: {
        name: candidate.name,
        stage: candidate.stage,
        sectors: candidate.sectors,
        whyInteresting: candidate.whyInteresting,
        websiteUrl: candidate.websiteUrl,
        careersUrl: candidate.careersUrl,
        source: "suggested",
        status: "watching",
        approvedAt: null,
        notes: `Discovery source: ${candidate.sourceDetail}`,
      },
    });

    await prisma.alert.create({
      data: {
        type: "suggestion",
        title: `Suggested startup: ${company.name}`,
        body: candidate.whyInteresting,
        companyId: company.id,
      },
    });

    // Also emit funding-style alert for thesis suggestions
    if (candidate.sourceDetail.startsWith("thesis:")) {
      await prisma.alert.create({
        data: {
          type: "funding",
          title: `Thesis match to review: ${company.name}`,
          body: `Sector signal from thesis. Approve only after replacing placeholder with a real company.`,
          companyId: company.id,
        },
      });
    }

    created.push(company);
  }

  return created;
}
