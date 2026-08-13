import { redirect } from 'next/navigation';

/**
 * /mentor is gone — it now lands on /chatbot.
 *
 * WHY THIS PAGE IS A REDIRECT AND NOT A CHAT SURFACE
 * --------------------------------------------------
 * There were two mentor surfaces answering the same question for the same
 * student, and only one of them was grounded:
 *
 *   /chatbot → /api/chatbot/message  builds its system prompt from
 *              lib/mentorEvidence.js, so every claim it makes about the
 *              student is backed by a row someone can point at.
 *   /mentor  → its own POST route    hand-rolled five prompt templates with
 *              no evidence import at all. The "roadmap" template instructed
 *              the model to tell the student "whether they are on track for
 *              job readiness" while handing it nothing to judge that from,
 *              and hardcoded "Day N/30" when the real plan runs 60–365 days
 *              (see roadmapTotalDays). Both are fabrication by construction.
 *
 * Two surfaces meant two prompts to keep in sync forever, and the ungrounded
 * one was the one that made confident claims. Rather than teach the second
 * prompt the same rules, the second prompt is deleted and the route with it.
 *
 * A server-side `redirect()` is used rather than a client `router.replace()`
 * so the browser gets a real 307 before anything renders — no flash of an
 * empty chat, and it still works with JS disabled. The path stays registered
 * (and still auth-guarded via proxy.js) so existing links and the sidebar
 * entry keep working instead of 404ing.
 */
export default function MentorPage() {
  redirect('/chatbot');
}
