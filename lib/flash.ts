/** Append a `saved` query param so the dashboard toast can confirm a mutation. */
export function withSaved(href: string, message = "Saved"): string {
  const [path, existing = ""] = href.split("?");
  const params = new URLSearchParams(existing);
  params.set("saved", message);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Client-side toast trigger for pages that don't redirect after a mutation. */
export function notifySaved(message = "Saved") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("job-sourcing:saved", { detail: message }));
}
