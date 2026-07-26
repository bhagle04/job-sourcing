import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.profile.findFirst();
  if (!existing) {
    await prisma.profile.create({
      data: {
        backgroundSummary:
          "Stanford ME, D1 athletics, early-stage VC experience. Targeting full-time roles across VC, hard-tech engineering, AI, and defense-related companies.",
        targetSectors: ["VC", "hard-tech", "AI", "defense"],
        thesis:
          "Prefer high-agency roles at startups and specialized teams where Stanford network, athletic drive, and early-stage operating/investing experience are differentiated.",
        targetCompMin: 150000,
        targetCompMax: 250000,
        voiceSamples:
          "Hey [Name] — hope you're well. I've been following what you're building at [Company] and would love to reconnect. I'm exploring full-time roles after graduation and thought of you given [shared hook]. Open to a short chat sometime soon?",
      },
    });
  }

  const companyCount = await prisma.company.count();
  if (companyCount === 0) {
    const acme = await prisma.company.create({
      data: {
        name: "Example Defense AI",
        stage: "Series A",
        sectors: ["AI", "defense"],
        source: "seeded",
        status: "watching",
        whyInteresting: "Seed example — replace with real watchlist companies.",
        careersUrl: "https://example.com/careers",
        approvedAt: new Date(),
      },
    });
    await prisma.person.create({
      data: {
        name: "Alex Alumni",
        currentTitle: "Founding Engineer",
        companyId: acme.id,
        relationshipStrength: "know",
        hooks: "Stanford · athletics overlap",
        nextFollowUpAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
