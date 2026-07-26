import Link from "next/link";
import { getAttentionFeed } from "@/lib/attention";
import { dismissAlert } from "./actions";

export default async function HomePage() {
  const { needsAction, whatsNew, alerts } = await getAttentionFeed();

  return (
    <div>
      <h1 className="page-title">Home</h1>
      <p className="page-subtitle">What needs action and what&apos;s new across your watchlist and network.</p>
      <div className="grid-2">
        <section className="stack">
          <h2>Needs action</h2>
          {needsAction.length === 0 ? (
            <div className="empty">Nothing due. Add follow-up dates on people or mark opportunities interested.</div>
          ) : (
            needsAction.map((item) => (
              <Link key={`${item.kind}-${item.id}`} href={item.href} className="card">
                <strong>{item.title}</strong>
                {item.subtitle ? <div className="muted">{item.subtitle}</div> : null}
                {item.dueAt ? <div className="muted">{new Date(item.dueAt).toLocaleString()}</div> : null}
              </Link>
            ))
          )}
        </section>
        <section className="stack">
          <h2>What&apos;s new</h2>
          {whatsNew.length === 0 ? (
            <div className="empty">No undismissed alerts yet. Monitors and suggestions will land here.</div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="card">
                <div className="row-actions" style={{ justifyContent: "space-between" }}>
                  <div>
                    <span className="badge">{alert.type}</span>
                    <div>
                      <Link href={whatsNew.find((w) => w.id === alert.id)?.href ?? "/home"}>
                        <strong>{alert.title}</strong>
                      </Link>
                    </div>
                    {alert.body ? <div className="muted">{alert.body}</div> : null}
                  </div>
                  <form action={dismissAlert.bind(null, alert.id)}>
                    <button className="btn ghost" type="submit">
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
