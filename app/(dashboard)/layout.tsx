import { requireSession } from "@/lib/auth";
import { Nav } from "@/components/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <div className="app-shell">
      <Nav />
      <main className="main">{children}</main>
    </div>
  );
}
