import { db } from "./db";

/**
 * Ephemeral-session guarantee: every fresh login (and every explicit sign-out)
 * clears the user's persisted planning data, so closing the browser and coming
 * back really does mean starting fresh.
 *
 * Scope of the wipe:
 *   - `plans`             — the transcript + schedule the student has been building
 *   - `saved_internships` — bookmarked listings (bookmarks belong to a session too)
 *
 * The AI chatbot's conversation lives only in React state and dies with the tab,
 * so nothing server-side needs cleaning up for it.
 *
 * Login-request rows in `login_requests` are NOT wiped here — they self-expire
 * and belong to the auth flow, not to a student's saved work.
 *
 * Failures are logged and swallowed. Sign-in must never be blocked by a
 * cleanup problem — worst case, the student sees old data for one visit and
 * the next wipe attempt fixes it.
 */
export async function wipeUserData(email: string): Promise<void> {
  try {
    await Promise.all([
      db()`DELETE FROM plans WHERE email = ${email}`,
      db()`DELETE FROM saved_internships WHERE email = ${email}`,
    ]);
  } catch (err) {
    console.error("wipeUserData failed:", err);
  }
}
