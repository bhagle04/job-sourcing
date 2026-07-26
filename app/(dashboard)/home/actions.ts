"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withSaved } from "@/lib/flash";
import { emptyToNull, parseSectors, profileSchema } from "@/lib/validators";

export async function updateProfile(formData: FormData) {
  const parsed = profileSchema.parse({
    backgroundSummary: formData.get("backgroundSummary"),
    targetSectors: formData.get("targetSectors"),
    thesis: formData.get("thesis"),
    targetCompMin: formData.get("targetCompMin") || null,
    targetCompMax: formData.get("targetCompMax") || null,
    voiceSamples: formData.get("voiceSamples"),
  });

  const existing = await prisma.profile.findFirst();
  if (existing) {
    await prisma.profile.update({
      where: { id: existing.id },
      data: {
        backgroundSummary: parsed.backgroundSummary,
        targetSectors: parseSectors(parsed.targetSectors),
        thesis: emptyToNull(parsed.thesis),
        targetCompMin: parsed.targetCompMin ?? null,
        targetCompMax: parsed.targetCompMax ?? null,
        voiceSamples: emptyToNull(parsed.voiceSamples),
      },
    });
  } else {
    await prisma.profile.create({
      data: {
        backgroundSummary: parsed.backgroundSummary,
        targetSectors: parseSectors(parsed.targetSectors),
        thesis: emptyToNull(parsed.thesis),
        targetCompMin: parsed.targetCompMin ?? null,
        targetCompMax: parsed.targetCompMax ?? null,
        voiceSamples: emptyToNull(parsed.voiceSamples),
      },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/agent");
  redirect(withSaved("/profile"));
}

export async function dismissAlert(id: string) {
  await prisma.alert.update({
    where: { id },
    data: { dismissedAt: new Date() },
  });
  revalidatePath("/home");
  redirect(withSaved("/home"));
}
