import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ relationship?: string }>;
}) {
  const params = await searchParams;
  const people = await prisma.person.findMany({
    where: {
      relationshipStrength: params.relationship
        ? (params.relationship as "know" | "warm" | "cold")
        : undefined,
    },
    include: { company: true },
    orderBy: [{ nextFollowUpAt: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 className="page-title">People</h1>
          <p className="page-subtitle">Stanford network and outreach targets.</p>
        </div>
        <div className="row-actions">
          <Link className="btn secondary" href="/people/import">
            Import CSV
          </Link>
          <Link className="btn" href="/people/new">
            Add person
          </Link>
        </div>
      </div>
      <form className="row-actions" style={{ marginBottom: "1rem" }}>
        <select name="relationship" defaultValue={params.relationship ?? ""}>
          <option value="">All relationships</option>
          <option value="know">know</option>
          <option value="warm">warm</option>
          <option value="cold">cold</option>
        </select>
        <button className="btn secondary" type="submit">
          Filter
        </button>
      </form>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Relationship</th>
              <th>Next follow-up</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/people/${p.id}`}>
                    <strong>{p.name}</strong>
                  </Link>
                  {p.currentTitle ? <div className="muted">{p.currentTitle}</div> : null}
                </td>
                <td>{p.company?.name ?? "—"}</td>
                <td>
                  <span className="badge">{p.relationshipStrength}</span>
                </td>
                <td>{p.nextFollowUpAt ? new Date(p.nextFollowUpAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {people.length === 0 ? <div className="empty">No people yet. Import your Stanford network CSV.</div> : null}
      </div>
    </div>
  );
}
