import { submitNetworkSignal, runDiscovery } from "./actions";

export default function DiscoveryPage() {
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Network & discovery</h1>
        <p className="page-subtitle">
          Log Stanford-network signals and generate suggested startups for approval.
        </p>
      </div>

      <form action={submitNetworkSignal} className="card">
        <h2>Record network signal</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="personName">Person name</label>
            <input id="personName" name="personName" required />
          </div>
          <div className="field">
            <label htmlFor="companyName">Company name</label>
            <input id="companyName" name="companyName" required />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="newTitle">New title / hiring note</label>
            <input id="newTitle" name="newTitle" />
          </div>
          <div className="field">
            <label htmlFor="signalType">Signal type</label>
            <select id="signalType" name="signalType" defaultValue="job_change">
              <option value="job_change">job_change</option>
              <option value="hiring">hiring</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="careersUrl">Careers URL (optional)</label>
          <input id="careersUrl" name="careersUrl" />
        </div>
        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" />
        </div>
        <button className="btn" type="submit">
          Save signal
        </button>
      </form>

      <form action={runDiscovery} className="card">
        <h2>Suggest startups</h2>
        <div className="field">
          <label htmlFor="query">Thesis / query override</label>
          <input id="query" name="query" placeholder="hard-tech, defense AI, climate hardware..." />
        </div>
        <button className="btn secondary" type="submit">
          Generate suggestions
        </button>
      </form>
    </div>
  );
}
