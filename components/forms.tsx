import {
  Company,
  CompanySource,
  CompanyStatus,
  Opportunity,
  OpportunityStatus,
  OpportunityType,
  Person,
  RelationshipStrength,
} from "@prisma/client";

type CompanyFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  company?: Company;
  submitLabel?: string;
};

export function CompanyForm({ action, company, submitLabel = "Save" }: CompanyFormProps) {
  return (
    <form action={action} className="card">
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required defaultValue={company?.name ?? ""} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="stage">Stage</label>
          <input id="stage" name="stage" defaultValue={company?.stage ?? ""} placeholder="Seed, Series A, ..." />
        </div>
        <div className="field">
          <label htmlFor="sectors">Sectors (comma-separated)</label>
          <input id="sectors" name="sectors" defaultValue={company?.sectors.join(", ") ?? ""} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="websiteUrl">Website</label>
          <input id="websiteUrl" name="websiteUrl" defaultValue={company?.websiteUrl ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="careersUrl">Careers URL</label>
          <input id="careersUrl" name="careersUrl" defaultValue={company?.careersUrl ?? ""} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="source">Source</label>
          <select id="source" name="source" defaultValue={company?.source ?? CompanySource.seeded}>
            <option value="seeded">seeded</option>
            <option value="network">network</option>
            <option value="suggested">suggested</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={company?.status ?? CompanyStatus.watching}>
            <option value="watching">watching</option>
            <option value="active">active</option>
            <option value="parked">parked</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="whyInteresting">Why interesting</label>
        <textarea id="whyInteresting" name="whyInteresting" defaultValue={company?.whyInteresting ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" defaultValue={company?.notes ?? ""} />
      </div>
      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

type PersonFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  person?: Person;
  companies: { id: string; name: string }[];
  submitLabel?: string;
};

export function PersonForm({ action, person, companies, submitLabel = "Save" }: PersonFormProps) {
  const followUpValue = person?.nextFollowUpAt
    ? new Date(person.nextFollowUpAt).toISOString().slice(0, 16)
    : "";

  return (
    <form action={action} className="card">
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required defaultValue={person?.name ?? ""} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" defaultValue={person?.email ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="linkedinUrl">LinkedIn URL</label>
          <input id="linkedinUrl" name="linkedinUrl" defaultValue={person?.linkedinUrl ?? ""} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="currentTitle">Title</label>
          <input id="currentTitle" name="currentTitle" defaultValue={person?.currentTitle ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="companyId">Company</label>
          <select id="companyId" name="companyId" defaultValue={person?.companyId ?? ""}>
            <option value="">None</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="relationshipStrength">Relationship</label>
          <select
            id="relationshipStrength"
            name="relationshipStrength"
            defaultValue={person?.relationshipStrength ?? RelationshipStrength.cold}
          >
            <option value="know">know</option>
            <option value="warm">warm</option>
            <option value="cold">cold</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="nextFollowUpAt">Next follow-up</label>
          <input id="nextFollowUpAt" name="nextFollowUpAt" type="datetime-local" defaultValue={followUpValue} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="hooks">Hooks (Stanford, athletics, VC, ...)</label>
        <textarea id="hooks" name="hooks" defaultValue={person?.hooks ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="researchNotes">Research notes</label>
        <textarea id="researchNotes" name="researchNotes" defaultValue={person?.researchNotes ?? ""} />
      </div>
      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

type OpportunityFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  opportunity?: Opportunity;
  companies: { id: string; name: string }[];
  people: { id: string; name: string }[];
  submitLabel?: string;
};

export function OpportunityForm({
  action,
  opportunity,
  companies,
  people,
  submitLabel = "Save",
}: OpportunityFormProps) {
  return (
    <form action={action} className="card">
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required defaultValue={opportunity?.title ?? ""} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="companyId">Company</label>
          <select id="companyId" name="companyId" required defaultValue={opportunity?.companyId ?? ""}>
            <option value="" disabled>
              Select company
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="warmPersonId">Warm person</label>
          <select id="warmPersonId" name="warmPersonId" defaultValue={opportunity?.warmPersonId ?? ""}>
            <option value="">None</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="url">URL</label>
          <input id="url" name="url" defaultValue={opportunity?.url ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="source">Source</label>
          <input id="source" name="source" defaultValue={opportunity?.source ?? ""} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={opportunity?.type ?? OpportunityType.job_post}>
            <option value="job_post">job_post</option>
            <option value="intro_path">intro_path</option>
            <option value="upcoming_hire">upcoming_hire</option>
            <option value="other">other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={opportunity?.status ?? OpportunityStatus.new}>
            <option value="new">new</option>
            <option value="interested">interested</option>
            <option value="applied">applied</option>
            <option value="closed">closed</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="fitScore">Fit score (0–100)</label>
        <input id="fitScore" name="fitScore" type="number" min={0} max={100} defaultValue={opportunity?.fitScore ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="whyFit">Why you fit</label>
        <textarea id="whyFit" name="whyFit" defaultValue={opportunity?.whyFit ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="talkingPoints">Talking points</label>
        <textarea id="talkingPoints" name="talkingPoints" defaultValue={opportunity?.talkingPoints ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="questionsToAsk">Questions to ask</label>
        <textarea id="questionsToAsk" name="questionsToAsk" defaultValue={opportunity?.questionsToAsk ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="compensationNotes">Compensation notes</label>
        <textarea id="compensationNotes" name="compensationNotes" defaultValue={opportunity?.compensationNotes ?? ""} />
      </div>
      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function InteractionForm({
  personId,
  opportunityId,
  action,
}: {
  personId?: string;
  opportunityId?: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="card">
      {personId ? <input type="hidden" name="personId" value={personId} /> : null}
      {opportunityId ? <input type="hidden" name="opportunityId" value={opportunityId} /> : null}
      <div className="grid-2">
        <div className="field">
          <label htmlFor="channel">Channel</label>
          <select id="channel" name="channel" defaultValue="email">
            <option value="email">email</option>
            <option value="linkedin">linkedin</option>
            <option value="call">call</option>
            <option value="other">other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="direction">Direction</label>
          <select id="direction" name="direction" defaultValue="outbound">
            <option value="outbound">outbound</option>
            <option value="inbound">inbound</option>
            <option value="note">note</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="summary">Summary</label>
        <input id="summary" name="summary" required />
      </div>
      <div className="field">
        <label htmlFor="body">Body / draft</label>
        <textarea id="body" name="body" />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="nextStep">Next step</label>
          <input id="nextStep" name="nextStep" />
        </div>
        <div className="field">
          <label htmlFor="nextFollowUpAt">Next follow-up</label>
          <input id="nextFollowUpAt" name="nextFollowUpAt" type="datetime-local" />
        </div>
      </div>
      <button className="btn" type="submit">
        Log interaction
      </button>
    </form>
  );
}
