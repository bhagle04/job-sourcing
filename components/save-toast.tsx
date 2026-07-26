"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SaveToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = searchParams.get("saved");
    if (!saved) return;

    setMessage(saved === "1" ? "Saved" : saved);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("saved");
    const next = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(next, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    function onSaved(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      setMessage(detail || "Saved");
    }
    window.addEventListener("job-sourcing:saved", onSaved);
    return () => window.removeEventListener("job-sourcing:saved", onSaved);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="save-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
