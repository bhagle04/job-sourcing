-- CreateEnum
CREATE TYPE "CompanySource" AS ENUM ('seeded', 'network', 'suggested');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('watching', 'active', 'parked');

-- CreateEnum
CREATE TYPE "RelationshipStrength" AS ENUM ('know', 'warm', 'cold');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('job_post', 'intro_path', 'upcoming_hire', 'other');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('new', 'interested', 'applied', 'closed');

-- CreateEnum
CREATE TYPE "InteractionChannel" AS ENUM ('email', 'linkedin', 'call', 'other');

-- CreateEnum
CREATE TYPE "InteractionDirection" AS ENUM ('outbound', 'inbound', 'note');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('new_role', 'follow_up_due', 'funding', 'network_move', 'monitor_error', 'suggestion');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT,
    "sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careersUrl" TEXT,
    "websiteUrl" TEXT,
    "source" "CompanySource" NOT NULL DEFAULT 'seeded',
    "status" "CompanyStatus" NOT NULL DEFAULT 'watching',
    "whyInteresting" TEXT,
    "notes" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "monitorError" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "currentTitle" TEXT,
    "companyId" TEXT,
    "relationshipStrength" "RelationshipStrength" NOT NULL DEFAULT 'cold',
    "hooks" TEXT,
    "researchNotes" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "url" TEXT,
    "source" TEXT,
    "type" "OpportunityType" NOT NULL DEFAULT 'job_post',
    "status" "OpportunityStatus" NOT NULL DEFAULT 'new',
    "fitScore" INTEGER,
    "whyFit" TEXT,
    "talkingPoints" TEXT,
    "questionsToAsk" TEXT,
    "compensationNotes" TEXT,
    "warmPersonId" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "opportunityId" TEXT,
    "channel" "InteractionChannel" NOT NULL DEFAULT 'email',
    "direction" "InteractionDirection" NOT NULL DEFAULT 'note',
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "companyId" TEXT,
    "personId" TEXT,
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "backgroundSummary" TEXT NOT NULL,
    "targetSectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thesis" TEXT,
    "targetCompMin" INTEGER,
    "targetCompMax" INTEGER,
    "voiceSamples" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Person_nextFollowUpAt_idx" ON "Person"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Person_relationshipStrength_idx" ON "Person"("relationshipStrength");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_companyId_externalId_key" ON "Opportunity"("companyId", "externalId");

-- CreateIndex
CREATE INDEX "Interaction_personId_occurredAt_idx" ON "Interaction"("personId", "occurredAt");

-- CreateIndex
CREATE INDEX "Alert_dismissedAt_createdAt_idx" ON "Alert"("dismissedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_warmPersonId_fkey" FOREIGN KEY ("warmPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
