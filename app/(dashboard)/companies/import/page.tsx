"use client";

import { useState, useTransition } from "react";
import { importCompaniesCsv } from "../actions";

export default function ImportCompaniesPage() {
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skippedErrors: string[];
  } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <h1 className="page-title">Import companies CSV</h1>
      <p className="page-subtitle">
        Columns: name (or company), stage, sectors, websiteUrl, careersUrl, whyInteresting, notes,
        status. Upserts by company name.
      </p>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            const res = await importCompaniesCsv(formData);
            setResult(res);
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
          <strong>
            Created {result.created}, updated {result.updated}
          </strong>
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
