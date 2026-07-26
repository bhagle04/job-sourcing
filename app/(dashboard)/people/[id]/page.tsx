import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractionForm, PersonForm } from "@/components/forms";
import { prisma } from "@/lib/prisma";
import { logInteraction, updatePerson } from "../actions";

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [person, companies] = await Promise.all([
    prisma.person.findUnique({
      where: { id },
      include: {
        company: true,
        interactions: { orderBy: { occurredAt: "desc" } },
        warmOpportunities: { include: { company: true } },
      },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!person) notFound();

  const save = updatePerson.bind(null, person.id);

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{person.name}</h1>
        <p className="page-subtitle">
          {person.company ? <Link href={`/companies/${person.company.id}`}>{person.company.name}</Link> : "No company"} ·{" "}
          {person.relationshipStrength}
        </p>
      </div>
      <PersonForm action={save} person={person} companies={companies} />
      <section className="stack">
        <h2>Log interaction</h2>
        <InteractionForm personId={person.id} action={logInteraction} />
      </section>
      <section className="card stack">
        <h2>Timeline</h2>
        {person.interactions.length === 0 ? (
          <div className="empty">No interactions yet.</div>
        ) : (
          person.interactions.map((i) => (
            <div key={i.id}>
              <strong>
                {i.direction} · {i.channel}
              </strong>
              <div>{i.summary}</div>
              {i.body ? <div className="muted">{i.body}</div> : null}
              <div className="muted">{new Date(i.occurredAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </section>
      {person.warmOpportunities.length > 0 ? (
        <section className="card stack">
          <h2>Warm paths</h2>
          {person.warmOpportunities.map((o) => (
            <Link key={o.id} href={`/opportunities/${o.id}`}>
              {o.title} @ {o.company.name}
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
