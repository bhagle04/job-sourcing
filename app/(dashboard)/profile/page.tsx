import { prisma } from "@/lib/prisma";
import { updateProfile } from "../home/actions";

export default async function ProfilePage() {
  const profile = await prisma.profile.findFirst();

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Background and voice samples the agent uses for drafts and fit notes.</p>
      <form action={updateProfile} className="card">
        <div className="field">
          <label htmlFor="backgroundSummary">Background summary</label>
          <textarea
            id="backgroundSummary"
            name="backgroundSummary"
            required
            defaultValue={profile?.backgroundSummary ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="targetSectors">Target sectors (comma-separated)</label>
          <input
            id="targetSectors"
            name="targetSectors"
            defaultValue={profile?.targetSectors.join(", ") ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="thesis">Thesis</label>
          <textarea id="thesis" name="thesis" defaultValue={profile?.thesis ?? ""} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="targetCompMin">Target comp min</label>
            <input
              id="targetCompMin"
              name="targetCompMin"
              type="number"
              defaultValue={profile?.targetCompMin ?? ""}
            />
          </div>
          <div className="field">
            <label htmlFor="targetCompMax">Target comp max</label>
            <input
              id="targetCompMax"
              name="targetCompMax"
              type="number"
              defaultValue={profile?.targetCompMax ?? ""}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="voiceSamples">Voice samples</label>
          <textarea id="voiceSamples" name="voiceSamples" defaultValue={profile?.voiceSamples ?? ""} />
        </div>
        <button className="btn" type="submit">
          Save profile
        </button>
      </form>
    </div>
  );
}
