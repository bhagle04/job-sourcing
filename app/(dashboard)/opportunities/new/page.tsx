import { OpportunityForm } from "@/components/forms";
import { prisma } from "@/lib/prisma";
import { createOpportunity } from "../actions";

export default async function NewOpportunityPage() {
  const [companies, people] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.person.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="page-title">Add opportunity</h1>
      <p className="page-subtitle">Track a role or intro path.</p>
      <OpportunityForm
        action={createOpportunity}
        companies={companies}
        people={people}
        submitLabel="Create opportunity"
      />
    </div>
  );
}
