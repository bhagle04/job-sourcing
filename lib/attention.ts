import { prisma } from "@/lib/prisma";

const STALE_INTERESTED_DAYS = 14;

export type AttentionItem = {
  kind: "follow_up" | "stale_opportunity" | "alert";
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  dueAt?: Date | null;
};

export async function getAttentionFeed() {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_INTERESTED_DAYS * 24 * 60 * 60 * 1000);

  const [duePeople, interestedOpps, alerts] = await Promise.all([
    prisma.person.findMany({
      where: { nextFollowUpAt: { lte: now } },
      include: { company: true },
      orderBy: { nextFollowUpAt: "asc" },
      take: 50,
    }),
    prisma.opportunity.findMany({
      where: {
        status: "interested",
        OR: [
          { interactions: { none: {} } },
          { interactions: { every: { occurredAt: { lt: staleBefore } } } },
        ],
      },
      include: {
        company: true,
        interactions: { orderBy: { occurredAt: "desc" }, take: 1 },
      },
      take: 50,
    }),
    prisma.alert.findMany({
      where: { dismissedAt: null },
      include: { company: true, person: true, opportunity: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const needsAction: AttentionItem[] = [
    ...duePeople.map((p) => ({
      kind: "follow_up" as const,
      id: p.id,
      title: `Follow up with ${p.name}`,
      subtitle: p.company?.name ?? p.currentTitle,
      href: `/people/${p.id}`,
      dueAt: p.nextFollowUpAt,
    })),
    ...interestedOpps.map((o) => ({
      kind: "stale_opportunity" as const,
      id: o.id,
      title: `${o.title} needs a next step`,
      subtitle: o.company.name,
      href: `/opportunities/${o.id}`,
      dueAt: o.interactions[0]?.occurredAt ?? o.updatedAt,
    })),
  ];

  const whatsNew: AttentionItem[] = alerts.map((a) => ({
    kind: "alert" as const,
    id: a.id,
    title: a.title,
    subtitle: a.body,
    href: a.opportunityId
      ? `/opportunities/${a.opportunityId}`
      : a.personId
        ? `/people/${a.personId}`
        : a.companyId
          ? `/companies/${a.companyId}`
          : "/home",
    dueAt: a.createdAt,
  }));

  return { needsAction, whatsNew, alerts };
}
