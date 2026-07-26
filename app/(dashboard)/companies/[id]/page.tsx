import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/forms";
import { prisma } from "@/lib/prisma";
import { approveSuggestedCompany, rejectSuggestedCompany, updateCompany } from "../actions";
import { runCareersMonitorForCompany } from "@/lib/monitors/careers";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      people: { orderBy: { name: "asc" } },
      opportunities: { orderBy: { updatedAt: "desc" } },
      alerts: { where: { dismissedAt: null }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!company) notFound();

  const save = updateCompany.bind(null, company.id);
  const needsApproval = company.source === "suggested" && !company.approvedAt;

  return (
    <div className="stack">
      <div className="row-actions" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">{company.name}</h1>
          <p className="page-subtitle">
            {company.sectors.join(" · ") || "No sectors"} · {company.status} · {company.source}
          </p>
        </div>
        <div className="row-actions">
          {needsApproval ? (
            <>
              <form action={approveSuggestedCompany.bind(null, company.id)}>
                <button className="btn" type="submit">
                  Approve to watchlist
                </button>
              </form>
              <form action={rejectSuggestedCompany.bind(null, company.id)}>
                <button className="btn ghost" type="submit">
                  Park
                </button>
              </form>
            </>
          ) : null}
          <form
            action={async () => {
              "use server";
              await runCareersMonitorForCompany(company.id);
            }}
          >
            <button className="btn secondary" type="submit">
              Check careers now
            </button>
          </form>
        </div>
      </div>

      {company.monitorError ? (
        <div className="card">
          <strong>Monitor error</strong>
          <div className="muted">{company.monitorError}</div>
        </div>
      ) : null}

      <CompanyForm action={save} company={company} />

      <div className="grid-2">
        <section className="card stack">
          <h2>People</h2>
          {company.people.length === 0 ? (
            <div className="empty">No people linked.</div>
          ) : (
            company.people.map((p) => (
              <Link key={p.id} href={`/people/${p.id}`}>
                {p.name} {p.currentTitle ? `· ${p.currentTitle}` : ""}
              </Link>
            ))
          )}
        </section>
        <section className="card stack">
          <h2>Opportunities</h2>
          {company.opportunities.length === 0 ? (
            <div className="empty">No opportunities yet.</div>
          ) : (
            company.opportunities.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`}>
                {o.title} <span className="badge">{o.status}</span>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
