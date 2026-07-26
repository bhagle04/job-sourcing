import { PersonForm } from "@/components/forms";
import { prisma } from "@/lib/prisma";
import { createPerson } from "../actions";

export default async function NewPersonPage() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div>
      <h1 className="page-title">Add person</h1>
      <p className="page-subtitle">Track someone from your network or a cold target.</p>
      <PersonForm action={createPerson} companies={companies} submitLabel="Create person" />
    </div>
  );
}
