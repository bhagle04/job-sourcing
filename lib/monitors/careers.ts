import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export type ScrapedJob = {
  externalId: string;
  title: string;
  url: string;
};

function hashId(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

/** Parse common public board HTML/JSON shapes without a headless browser. */
export function extractJobsFromCareersHtml(html: string, careersUrl: string): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];

  // Greenhouse embedded boards often include absolute job links
  const greenhouse = [...html.matchAll(/href="(https:\/\/boards\.greenhouse\.io\/[^"]+\/jobs\/(\d+)[^"]*)"[^>]*>([^<]+)</gi)];
  for (const match of greenhouse) {
    jobs.push({
      url: match[1],
      externalId: `gh-${match[2]}`,
      title: decodeHtml(match[3].trim()),
    });
  }

  // Ashby public job links
  const ashby = [...html.matchAll(/href="(https:\/\/jobs\.ashbyhq\.com\/[^"]+\/([0-9a-f-]{8,})[^"]*)"[^>]*>([^<]+)</gi)];
  for (const match of ashby) {
    jobs.push({
      url: match[1],
      externalId: `ashby-${match[2]}`,
      title: decodeHtml(match[3].trim()),
    });
  }

  // Lever
  const lever = [...html.matchAll(/href="(https:\/\/jobs\.lever\.co\/[^"]+\/([0-9a-f-]{8,})[^"]*)"[^>]*>([^<]+)</gi)];
  for (const match of lever) {
    jobs.push({
      url: match[1],
      externalId: `lever-${match[2]}`,
      title: decodeHtml(match[3].trim()),
    });
  }

  // Generic absolute links that look like job postings
  if (jobs.length === 0) {
    const generic = [...html.matchAll(/href="((?:https?:)?\/\/[^"]*(?:jobs?|careers|positions)\/[^"]+)"[^>]*>([^<]{4,120})</gi)];
    for (const match of generic) {
      const url = match[1].startsWith("http") ? match[1] : new URL(match[1], careersUrl).toString();
      const title = decodeHtml(match[2].trim());
      if (!title || title.toLowerCase().includes("view all")) continue;
      jobs.push({
        url,
        externalId: `gen-${hashId(url)}`,
        title,
      });
    }
  }

  // Deduplicate by externalId
  const seen = new Set<string>();
  return jobs.filter((j) => {
    if (seen.has(j.externalId)) return false;
    seen.add(j.externalId);
    return true;
  });
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function runCareersMonitorForCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");
  if (!company.careersUrl) {
    await prisma.company.update({
      where: { id: companyId },
      data: { monitorError: "No careersUrl configured", lastCheckedAt: new Date() },
    });
    return { created: 0, error: "No careersUrl configured" };
  }

  try {
    const response = await fetch(company.careersUrl, {
      headers: { "User-Agent": "job-sourcing-monitor/0.1" },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const jobs = extractJobsFromCareersHtml(html, company.careersUrl);
    let created = 0;

    for (const job of jobs) {
      const existing = await prisma.opportunity.findFirst({
        where: {
          companyId,
          OR: [{ externalId: job.externalId }, { url: job.url }, { title: job.title }],
        },
      });
      if (existing) continue;

      const opportunity = await prisma.opportunity.create({
        data: {
          title: job.title,
          companyId,
          url: job.url,
          source: "careers_monitor",
          externalId: job.externalId,
          type: "job_post",
          status: "new",
        },
      });
      await prisma.alert.create({
        data: {
          type: "new_role",
          title: `New role: ${job.title} at ${company.name}`,
          body: job.url,
          companyId,
          opportunityId: opportunity.id,
        },
      });
      created += 1;
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { lastCheckedAt: new Date(), monitorError: null },
    });

    return { created, checked: jobs.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown monitor error";
    await prisma.company.update({
      where: { id: companyId },
      data: { lastCheckedAt: new Date(), monitorError: message },
    });
    await prisma.alert.create({
      data: {
        type: "monitor_error",
        title: `Monitor failed for ${company.name}`,
        body: message,
        companyId,
      },
    });
    return { created: 0, error: message };
  }
}

export async function runCareersMonitorAll() {
  const companies = await prisma.company.findMany({
    where: {
      status: { in: ["watching", "active"] },
      careersUrl: { not: null },
      approvedAt: { not: null },
    },
  });

  const results = [];
  for (const company of companies) {
    results.push({ companyId: company.id, ...(await runCareersMonitorForCompany(company.id)) });
  }
  return results;
}
