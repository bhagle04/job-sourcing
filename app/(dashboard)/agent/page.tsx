"use client";

import { useState, useTransition } from "react";
import { runAgentAction } from "./actions";
import type { AgentToolName } from "@/lib/agent/tools";

const tools: { value: AgentToolName; label: string; fields: string[] }[] = [
  { value: "weekly_triage", label: "Weekly triage", fields: [] },
  { value: "suggest_startups", label: "Suggest startups", fields: ["query"] },
  { value: "research_person", label: "Research person", fields: ["personId", "context"] },
  { value: "research_company", label: "Research company", fields: ["companyId", "context"] },
  { value: "draft_outreach", label: "Draft outreach", fields: ["personId", "goal", "tone"] },
  { value: "score_opportunity", label: "Score opportunity", fields: ["opportunityId", "context"] },
  {
    value: "upsert_company",
    label: "Upsert company",
    fields: ["name", "whyInteresting", "careersUrl", "websiteUrl", "source"],
  },
  {
    value: "upsert_person",
    label: "Upsert person",
    fields: ["name", "email", "currentTitle", "companyId", "relationshipStrength", "hooks"],
  },
  {
    value: "upsert_opportunity",
    label: "Upsert opportunity",
    fields: ["title", "companyId", "url", "warmPersonId", "type", "source"],
  },
  {
    value: "log_interaction",
    label: "Log interaction",
    fields: ["personId", "summary", "body", "nextFollowUpAt", "channel", "direction"],
  },
];

export default function AgentPage() {
  const [tool, setTool] = useState<AgentToolName>("weekly_triage");
  const [output, setOutput] = useState("Pick a tool and run it. Writes go into the same dashboard records.");
  const [pending, startTransition] = useTransition();
  const selected = tools.find((t) => t.value === tool)!;

  return (
    <div>
      <h1 className="page-title">Agent</h1>
      <p className="page-subtitle">
        Research, draft, score, and triage — drafts are never auto-sent. Suggestions need approval.
      </p>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await runAgentAction(formData);
            setOutput(JSON.stringify(result, null, 2));
          });
        }}
      >
        <div className="field">
          <label htmlFor="tool">Tool</label>
          <select
            id="tool"
            name="tool"
            value={tool}
            onChange={(e) => setTool(e.target.value as AgentToolName)}
          >
            {tools.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {selected.fields.map((field) => (
          <div className="field" key={field}>
            <label htmlFor={field}>{field}</label>
            <input id={field} name={field} />
          </div>
        ))}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Running…" : "Run tool"}
        </button>
      </form>
      <pre className="agent-log" style={{ marginTop: "1rem" }}>
        {output}
      </pre>
    </div>
  );
}
