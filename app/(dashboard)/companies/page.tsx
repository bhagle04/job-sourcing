import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const params = await searchParams;
  const companies = await prisma.company.findMany({
    where: {
      status: params.status ? (params.status as "watching" | "active" | "parked") : undefined,
      source: params.source ? (params.source as "seeded" | "network" | "suggested") : undefined,
    },
    include: {
      _count: { select: { people: true, opportunities: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Watchlist of startups, VC firms, and target teams.</p>
        </div>
        <div className="row-actions">
          <Link className="btn secondary" href="/companies/import">
            Import CSV
          </Link>
          <Link className="btn" href="/companies/new">
            Add company
          </Link>
        </div>
      </div>
      <form className="row-actions" style={{ marginBottom: "1rem" }}>
        <select name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          <option value="watching">watching</option>
          <option value="active">active</option>
          <option value="parked">parked</option>
        </select>
        <select name="source" defaultValue={params.source ?? ""}>
          <option value="">All sources</option>
          <option value="seeded">seeded</option>
          <option value="network">network</option>
          <option value="suggested">suggested</option>
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
              <th>Status</th>
              <th>Source</th>
              <th>People</th>
              <th>Roles</th>
              <th>Monitor</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/companies/${c.id}`}>
                    <strong>{c.name}</strong>
                  </Link>
                  {c.stage ? <div className="muted">{c.stage}</div> : null}
                </td>
                <td>
                  <span className="badge">{c.status}</span>
                </td>
                <td>{c.source}</td>
                <td>{c._count.people}</td>
                <td>{c._count.opportunities}</td>
                <td>
                  {c.monitorError ? (
                    <span className="muted">error</span>
                  ) : c.lastCheckedAt ? (
                    new Date(c.lastCheckedAt).toLocaleDateString()
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 ? <div className="empty">No companies yet.</div> : null}
      </div>
    </div>
  );
}
