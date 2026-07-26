"use client";

import { useState, useTransition } from "react";
import { notifySaved } from "@/lib/flash";
import { importPeopleCsv } from "../actions";

export default function ImportPeoplePage() {
  const [result, setResult] = useState<{ created: number; skippedErrors: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <h1 className="page-title">Import people CSV</h1>
      <p className="page-subtitle">
        Columns: name, email, linkedinUrl, currentTitle, companyName, relationshipStrength, hooks
      </p>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            const res = await importPeopleCsv(formData);
            setResult(res);
            notifySaved(`Imported — created ${res.created}`);
          });
        }}
      >
        <div className="field">
          <label htmlFor="file">CSV file</label>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import"}
        </button>
      </form>
      {result ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <strong>Created {result.created} people</strong>
          {result.skippedErrors.length > 0 ? (
            <ul>
              {result.skippedErrors.map((err) => (
                <li key={err} className="muted">
                  {err}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
