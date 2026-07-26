import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const opportunities = await prisma.opportunity.findMany({
    where: {
      status: params.status ? (params.status as "new" | "interested" | "applied" | "closed") : undefined,
    },
    include: { company: true, warmPerson: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 className="page-title">Opportunities</h1>
          <p className="page-subtitle">Roles and non-public paths across your watchlist.</p>
        </div>
        <Link className="btn" href="/opportunities/new">
          Add opportunity
        </Link>
      </div>
      <form className="row-actions" style={{ marginBottom: "1rem" }}>
        <select name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          <option value="new">new</option>
          <option value="interested">interested</option>
          <option value="applied">applied</option>
          <option value="closed">closed</option>
        </select>
        <button className="btn secondary" type="submit">
          Filter
        </button>
      </form>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Fit</th>
              <th>Warm path</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/opportunities/${o.id}`}>
                    <strong>{o.title}</strong>
                  </Link>
                  <div className="muted">{o.type}</div>
                </td>
                <td>{o.company.name}</td>
                <td>
                  <span className="badge">{o.status}</span>
                </td>
                <td>{o.fitScore ?? "—"}</td>
                <td>{o.warmPerson?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {opportunities.length === 0 ? <div className="empty">No opportunities yet.</div> : null}
      </div>
    </div>
  );
}
