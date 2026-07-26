"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/home", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/people", label: "People" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/discovery", label: "Discovery" },
  { href: "/agent", label: "Agent" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">Job Sourcing</div>
      <nav>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link"
            data-active={pathname === link.href || pathname.startsWith(`${link.href}/`)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <form action="/api/auth/logout" method="post" style={{ marginTop: "1.5rem" }}>
        <button className="btn ghost" type="submit">
          Sign out
        </button>
      </form>
    </aside>
  );
}
