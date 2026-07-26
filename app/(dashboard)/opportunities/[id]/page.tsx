import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractionForm, OpportunityForm } from "@/components/forms";
import { prisma } from "@/lib/prisma";
import { logInteraction } from "@/app/(dashboard)/people/actions";
import { updateOpportunity } from "../actions";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [opportunity, companies, people] = await Promise.all([
    prisma.opportunity.findUnique({
      where: { id },
      include: {
        company: true,
        warmPerson: true,
        interactions: { orderBy: { occurredAt: "desc" } },
      },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.person.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!opportunity) notFound();

  const save = updateOpportunity.bind(null, opportunity.id);

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{opportunity.title}</h1>
        <p className="page-subtitle">
          <Link href={`/companies/${opportunity.companyId}`}>{opportunity.company.name}</Link>
          {opportunity.warmPerson ? (
            <>
              {" "}
              · warm: <Link href={`/people/${opportunity.warmPerson.id}`}>{opportunity.warmPerson.name}</Link>
            </>
          ) : null}
        </p>
      </div>
      <OpportunityForm action={save} opportunity={opportunity} companies={companies} people={people} />
      <section className="stack">
        <h2>Log note</h2>
        <InteractionForm opportunityId={opportunity.id} action={logInteraction} />
      </section>
      <section className="card stack">
        <h2>History</h2>
        {opportunity.interactions.length === 0 ? (
          <div className="empty">No notes yet.</div>
        ) : (
          opportunity.interactions.map((i) => (
            <div key={i.id}>
              <strong>{i.summary}</strong>
              {i.body ? <div className="muted">{i.body}</div> : null}
              <div className="muted">{new Date(i.occurredAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
