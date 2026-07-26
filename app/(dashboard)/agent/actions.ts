"use server";

import { revalidatePath } from "next/cache";
import { AgentToolName, runAgentTool } from "@/lib/agent/tools";

export async function runAgentAction(formData: FormData) {
  const tool = String(formData.get("tool") ?? "") as AgentToolName;
  const input: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "tool") continue;
    input[key] = String(value);
  }
  const result = await runAgentTool(tool, input);
  revalidatePath("/home");
  revalidatePath("/companies");
  revalidatePath("/people");
  revalidatePath("/opportunities");
  return result;
}
