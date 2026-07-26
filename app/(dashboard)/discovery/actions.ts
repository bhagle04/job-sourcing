"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordNetworkSignal } from "@/lib/monitors/network";
import { suggestStartups } from "@/lib/monitors/discovery";

export async function submitNetworkSignal(formData: FormData) {
  await recordNetworkSignal({
    personName: String(formData.get("personName") ?? ""),
    personId: String(formData.get("personId") || "") || undefined,
    companyName: String(formData.get("companyName") ?? ""),
    newTitle: String(formData.get("newTitle") || "") || undefined,
    signalType: (String(formData.get("signalType") || "job_change") as "job_change" | "hiring"),
    notes: String(formData.get("notes") || "") || undefined,
    careersUrl: String(formData.get("careersUrl") || "") || undefined,
  });
  revalidatePath("/home");
  revalidatePath("/companies");
  revalidatePath("/people");
  redirect("/home");
}

export async function runDiscovery(formData: FormData) {
  await suggestStartups(String(formData.get("query") || ""));
  revalidatePath("/home");
  revalidatePath("/companies");
  redirect("/companies?source=suggested");
}
