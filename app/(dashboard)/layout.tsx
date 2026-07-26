import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { SaveToast } from "@/components/save-toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <div className="app-shell">
      <Nav />
      <main className="main">{children}</main>
      <Suspense fallback={null}>
        <SaveToast />
      </Suspense>
    </div>
  );
}
