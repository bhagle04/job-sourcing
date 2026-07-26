import { prisma } from "@/lib/prisma";

export type AgentToolName =
  | "upsert_company"
  | "upsert_person"
  | "upsert_opportunity"
  | "log_interaction"
  | "research_person"
  | "research_company"
  | "draft_outreach"
  | "score_opportunity"
  | "weekly_triage"
  | "suggest_startups";

export type AgentToolResult = {
  ok: boolean;
  message: string;
  data?: unknown;
};

function requireOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return key;
}

async function chat(system: string, user: string): Promise<string> {
  const key = requireOpenAI();
  if (!key) {
    return [
      "[Offline draft — set OPENAI_API_KEY for live model output]",
      system.slice(0, 200),
      "",
      user,
    ].join("\n");
  }

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: key });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
  });
  return response.choices[0]?.message?.content ?? "";
}

async function getProfileContext() {
  const profile = await prisma.profile.findFirst();
  if (!profile) return "No profile configured.";
  return [
    profile.backgroundSummary,
    `Sectors: ${profile.targetSectors.join(", ")}`,
    profile.thesis ? `Thesis: ${profile.thesis}` : "",
    profile.targetCompMin || profile.targetCompMax
      ? `Comp: ${profile.targetCompMin ?? "?"}–${profile.targetCompMax ?? "?"}`
      : "",
    profile.voiceSamples ? `Voice samples:\n${profile.voiceSamples}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function runAgentTool(
  tool: AgentToolName,
  input: Record<string, string>,
): Promise<AgentToolResult> {
  switch (tool) {
    case "upsert_company": {
      const name = input.name?.trim();
      if (!name) return { ok: false, message: "name is required" };
      const existing = await prisma.company.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      const company = existing
        ? await prisma.company.update({
            where: { id: existing.id },
            data: {
              whyInteresting: input.whyInteresting || existing.whyInteresting,
              careersUrl: input.careersUrl || existing.careersUrl,
              websiteUrl: input.websiteUrl || existing.websiteUrl,
              notes: input.notes || existing.notes,
            },
          })
        : await prisma.company.create({
            data: {
              name,
              whyInteresting: input.whyInteresting || null,
              careersUrl: input.careersUrl || null,
              websiteUrl: input.websiteUrl || null,
              notes: input.notes || null,
              source: (input.source as "seeded" | "network" | "suggested") || "seeded",
              approvedAt: new Date(),
            },
          });
      return { ok: true, message: `Saved company ${company.name}`, data: company };
    }
    case "upsert_person": {
      const name = input.name?.trim();
      if (!name) return { ok: false, message: "name is required" };
      const person = await prisma.person.create({
        data: {
          name,
          email: input.email || null,
          linkedinUrl: input.linkedinUrl || null,
          currentTitle: input.currentTitle || null,
          companyId: input.companyId || null,
          relationshipStrength: (input.relationshipStrength as "know" | "warm" | "cold") || "cold",
          hooks: input.hooks || null,
        },
      });
      return { ok: true, message: `Saved person ${person.name}`, data: person };
    }
    case "upsert_opportunity": {
      if (!input.title || !input.companyId) {
        return { ok: false, message: "title and companyId are required" };
      }
      const opportunity = await prisma.opportunity.create({
        data: {
          title: input.title,
          companyId: input.companyId,
          url: input.url || null,
          source: input.source || "agent",
          warmPersonId: input.warmPersonId || null,
          type: (input.type as "job_post" | "intro_path" | "upcoming_hire" | "other") || "job_post",
        },
      });
      return { ok: true, message: `Saved opportunity ${opportunity.title}`, data: opportunity };
    }
    case "log_interaction": {
      if (!input.summary || !input.personId) {
        return { ok: false, message: "personId and summary are required" };
      }
      await prisma.interaction.create({
        data: {
          personId: input.personId,
          opportunityId: input.opportunityId || null,
          summary: input.summary,
          body: input.body || null,
          channel: (input.channel as "email" | "linkedin" | "call" | "other") || "email",
          direction: (input.direction as "outbound" | "inbound" | "note") || "outbound",
          nextStep: input.nextStep || null,
        },
      });
      await prisma.person.update({
        where: { id: input.personId },
        data: {
          lastContactAt: new Date(),
          nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : undefined,
        },
      });
      return { ok: true, message: "Logged interaction" };
    }
    case "research_person": {
      const person = await prisma.person.findUnique({
        where: { id: input.personId },
        include: { company: true },
      });
      if (!person) return { ok: false, message: "Person not found" };
      const profile = await getProfileContext();
      const notes = await chat(
        "You research networking contacts for a job search. Return concise hooks and shared background bullets.",
        `My profile:\n${profile}\n\nPerson: ${person.name}\nTitle: ${person.currentTitle}\nCompany: ${person.company?.name}\nExisting hooks: ${person.hooks}\nExtra context: ${input.context ?? ""}`,
      );
      const updated = await prisma.person.update({
        where: { id: person.id },
        data: { researchNotes: notes, hooks: person.hooks ? `${person.hooks}\n${notes.slice(0, 500)}` : notes.slice(0, 500) },
      });
      return { ok: true, message: "Research saved on person", data: updated };
    }
    case "research_company": {
      const company = await prisma.company.findUnique({ where: { id: input.companyId } });
      if (!company) return { ok: false, message: "Company not found" };
      const profile = await getProfileContext();
      const notes = await chat(
        "You research companies for a personal job-search CRM. Return why interesting, relevant teams, and hooks.",
        `My profile:\n${profile}\n\nCompany: ${company.name}\nStage: ${company.stage}\nSectors: ${company.sectors.join(", ")}\nExisting: ${company.whyInteresting}\nExtra: ${input.context ?? ""}`,
      );
      const updated = await prisma.company.update({
        where: { id: company.id },
        data: {
          whyInteresting: notes.slice(0, 2000),
          notes: company.notes ? `${company.notes}\n\n${notes}` : notes,
        },
      });
      return { ok: true, message: "Research saved on company", data: updated };
    }
    case "draft_outreach": {
      const person = await prisma.person.findUnique({
        where: { id: input.personId },
        include: { company: true },
      });
      if (!person) return { ok: false, message: "Person not found" };
      const profile = await getProfileContext();
      const draft = await chat(
        "Draft a concise, personal outreach message. Do not be generic. Match the user's voice samples. Do not send — draft only.",
        `My profile:\n${profile}\n\nRecipient: ${person.name}\nTitle: ${person.currentTitle}\nCompany: ${person.company?.name}\nHooks: ${person.hooks}\nResearch: ${person.researchNotes}\nGoal: ${input.goal ?? "explore opportunities / reconnect"}\nTone: ${input.tone ?? "warm"}`,
      );
      await prisma.interaction.create({
        data: {
          personId: person.id,
          channel: "email",
          direction: "outbound",
          summary: "Agent outreach draft (not sent)",
          body: draft,
          nextStep: "Review and send manually",
        },
      });
      return { ok: true, message: "Draft saved as interaction on person (not sent)", data: { draft } };
    }
    case "score_opportunity": {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: input.opportunityId },
        include: { company: true, warmPerson: true },
      });
      if (!opportunity) return { ok: false, message: "Opportunity not found" };
      const profile = await getProfileContext();
      const analysis = await chat(
        "Score fit 0-100 and produce why-fit, talking points, and questions. Respond as JSON with keys fitScore, whyFit, talkingPoints, questionsToAsk.",
        `My profile:\n${profile}\n\nRole: ${opportunity.title}\nCompany: ${opportunity.company.name}\nURL: ${opportunity.url}\nWarm person: ${opportunity.warmPerson?.name ?? "none"}\nNotes: ${input.context ?? ""}`,
      );

      let fitScore = opportunity.fitScore;
      let whyFit = analysis;
      let talkingPoints = opportunity.talkingPoints;
      let questionsToAsk = opportunity.questionsToAsk;
      try {
        const jsonStart = analysis.indexOf("{");
        const jsonEnd = analysis.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const parsed = JSON.parse(analysis.slice(jsonStart, jsonEnd + 1)) as {
            fitScore?: number;
            whyFit?: string;
            talkingPoints?: string;
            questionsToAsk?: string;
          };
          fitScore = parsed.fitScore ?? fitScore;
          whyFit = parsed.whyFit ?? whyFit;
          talkingPoints = parsed.talkingPoints ?? talkingPoints;
          questionsToAsk = parsed.questionsToAsk ?? questionsToAsk;
        }
      } catch {
        // keep freeform analysis in whyFit
      }

      const updated = await prisma.opportunity.update({
        where: { id: opportunity.id },
        data: { fitScore, whyFit, talkingPoints, questionsToAsk },
      });
      return { ok: true, message: "Fit notes saved on opportunity", data: updated };
    }
    case "weekly_triage": {
      const now = new Date();
      const [duePeople, alerts, interested] = await Promise.all([
        prisma.person.findMany({
          where: { nextFollowUpAt: { lte: now } },
          include: { company: true },
          orderBy: { nextFollowUpAt: "asc" },
          take: 10,
        }),
        prisma.alert.findMany({
          where: { dismissedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.opportunity.findMany({
          where: { status: "interested" },
          include: { company: true },
          take: 10,
        }),
      ]);
      const profile = await getProfileContext();
      const triage = await chat(
        "Produce a ranked weekly action list (max 8 bullets) for a job search. Be concrete.",
        `Profile:\n${profile}\n\nDue follow-ups:\n${duePeople
          .map((p) => `- ${p.name} @ ${p.company?.name ?? "?"} due ${p.nextFollowUpAt?.toISOString()}`)
          .join("\n")}\n\nAlerts:\n${alerts.map((a) => `- ${a.type}: ${a.title}`).join("\n")}\n\nInterested roles:\n${interested
          .map((o) => `- ${o.title} @ ${o.company.name}`)
          .join("\n")}`,
      );
      return {
        ok: true,
        message: "Weekly triage ready",
        data: { triage, duePeople, alerts, interested },
      };
    }
    case "suggest_startups": {
      const { suggestStartups } = await import("@/lib/monitors/discovery");
      const suggestions = await suggestStartups(input.query || input.thesis || "");
      return {
        ok: true,
        message: `Created ${suggestions.length} suggested companies (approval required)`,
        data: suggestions,
      };
    }
    default:
      return { ok: false, message: `Unknown tool: ${tool}` };
  }
}
