import { CompanyForm } from "@/components/forms";
import { createCompany } from "../actions";

export default function NewCompanyPage() {
  return (
    <div>
      <h1 className="page-title">Add company</h1>
      <p className="page-subtitle">Seed your watchlist with startups and target firms.</p>
      <CompanyForm action={createCompany} submitLabel="Create company" />
    </div>
  );
}
