import { redirect } from "next/navigation";
import { getSession, verifyPassword } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session.isLoggedIn) redirect("/home");
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    if (!verifyPassword(password)) {
      redirect("/login?error=1");
    }
    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();
    redirect("/home");
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1 className="page-title">Job Sourcing</h1>
        <p className="page-subtitle">Personal tracker for companies, people, and roles.</p>
        {params.error ? <p className="muted">Incorrect password.</p> : null}
        <form action={login}>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoFocus />
          </div>
          <button className="btn" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
