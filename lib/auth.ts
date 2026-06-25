import { createHash } from "crypto";
import { cookies } from "next/headers";
import { profiles } from "@/lib/collections";
import type { Profile } from "@/lib/types";

const SESSION_COOKIE = "session";

/** Deterministic 24-char id derived from the email. */
function idForEmail(email: string): string {
  return createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 24);
}

/**
 * Upsert a profile for the given email.
 * Returns the (possibly newly created) profile. The caller is responsible
 * for setting the session cookie on the response.
 */
export async function loginOrCreate(
  email: string,
  name: string
): Promise<Profile> {
  const _id = idForEmail(email);
  const col = await profiles();

  await col.updateOne(
    { _id },
    {
      $set: { name, email },
      $setOnInsert: { interests: [], createdAt: new Date() },
    },
    { upsert: true }
  );

  const profile = await col.findOne({ _id });
  if (!profile) {
    // Should never happen right after an upsert.
    throw new Error("Failed to load profile after login");
  }

  return profile as Profile;
}

/** Resolve the currently logged-in profile from the session cookie. */
export async function getCurrentUser(): Promise<Profile | null> {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const col = await profiles();
  const profile = await col.findOne({ _id: id });
  return (profile as Profile) ?? null;
}

/** Clear the session cookie. */
export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}
