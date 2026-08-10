/**
 * Placement Journey, Part 1: WHERE to apply.
 *
 * This is a DIRECTORY, not a job board. It answers "where do I go to apply to
 * this company" and nothing else. It deliberately does NOT carry:
 *
 *   - hiring deadlines          — we cannot verify a date in real time
 *   - "currently hiring" flags  — same, and a stale one is worse than none
 *   - open-role counts          — we do not read anyone's ATS
 *   - deep links to a specific requisition — those rot within weeks and a
 *     guessed one is indistinguishable from a fabricated one
 *
 * Every URL below is the company's or portal's ROOT careers domain, checked by
 * hand against a live HTTP request on 2026-08-08. Two of them (tcs.com,
 * infosys.com) sit behind a WAF that returns 403 to every automated client
 * including a browser-UA curl, so they could not be machine-confirmed; both are
 * the long-standing canonical careers path on the company's own primary domain,
 * and neither is a deep link. `linkCheck` records which is which so this claim
 * stays auditable instead of living in a commit message.
 *
 * THE COMPANY LIST IS NOT INVENTED. It is Object.keys(COMPANY_PROFILES) from
 * lib/curriculumGenerator.js — the same nine companies the roadmap generator
 * and the readiness score already use. Adding a company here without adding it
 * there would produce a directory entry with no interview profile and no
 * readiness score behind it.
 *
 * SERVER-ONLY. Importing curriculumGenerator pulls the whole AI day-generator
 * into whatever bundle touches it, so this module is consumed by
 * app/api/apply/directory/route.js and never by a client component.
 */

import { COMPANY_PROFILES } from './curriculumGenerator';
import { COMPANIES } from './companiesData';

/** Machine-confirmed 200 on 2026-08-08 vs. blocked-to-all-bots (403 to every path). */
const CHECK_OK = 'http-200';
const CHECK_WAF = 'waf-blocked';

/**
 * Careers destination per company. Keyed by the exact COMPANY_PROFILES key.
 *
 * `campusProgram` is filled in ONLY where the company's existing
 * COMPANY_PROFILES blurb already names its campus hiring test — i.e. it is
 * repeated from data this repo already carried, not asserted fresh here. Where
 * it is null the UI tells the student to ask their TPO rather than claiming
 * anything about whether that company visits their college.
 */
const CAREERS = {
  'Amazon': {
    url: 'https://www.amazon.jobs/',
    label: 'amazon.jobs',
    linkCheck: CHECK_OK,
    campusProgram: null,
  },
  'Microsoft': {
    url: 'https://careers.microsoft.com/',
    label: 'careers.microsoft.com',
    linkCheck: CHECK_OK,
    campusProgram: null,
  },
  'Google': {
    url: 'https://www.google.com/about/careers/applications/',
    label: 'google.com/about/careers',
    linkCheck: CHECK_OK,
    campusProgram: null,
  },
  'Flipkart': {
    url: 'https://www.flipkartcareers.com/',
    label: 'flipkartcareers.com',
    linkCheck: CHECK_OK,
    campusProgram: null,
  },
  'TCS': {
    url: 'https://www.tcs.com/careers',
    label: 'tcs.com/careers',
    linkCheck: CHECK_WAF,
    campusProgram: 'TCS NQT',
  },
  'Infosys': {
    url: 'https://www.infosys.com/careers/',
    label: 'infosys.com/careers',
    linkCheck: CHECK_WAF,
    campusProgram: 'Infosys SP / InfyTQ',
  },
  'Wipro': {
    url: 'https://careers.wipro.com/',
    label: 'careers.wipro.com',
    linkCheck: CHECK_OK,
    campusProgram: 'Wipro NLTH',
  },
  'Accenture': {
    url: 'https://www.accenture.com/in-en/careers',
    label: 'accenture.com/in-en/careers',
    linkCheck: CHECK_OK,
    campusProgram: null,
  },
  'Ather Energy': {
    url: 'https://www.atherenergy.com/careers',
    label: 'atherenergy.com/careers',
    linkCheck: CHECK_OK,
    campusProgram: null,
  },
};

/**
 * Off-campus platforms. Root domains only, all machine-confirmed on 2026-08-08
 * except workatastartup.com, which answers 406 to a scripted request but is
 * reachable in a browser — it is Y Combinator's own long-standing job board
 * domain, and again a root, not a deep link.
 *
 * No aggregator that requires payment to apply, and no Telegram/WhatsApp
 * "off-campus drive" channel: those republish listings without attribution and
 * are the single most common source of dead and fake apply-links students hit.
 */
export const JOB_PORTALS = [
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs/',
    linkCheck: CHECK_OK,
    kind: 'General',
    what: 'The widest net for off-campus roles, and where most recruiters actually source. Set alerts per role and location rather than browsing.',
  },
  {
    id: 'naukri-campus',
    name: 'Naukri Campus',
    url: 'https://www.naukri.com/campus',
    linkCheck: CHECK_OK,
    kind: 'Freshers',
    what: 'Naukri\'s fresher/campus arm — a large share of Indian service-company and mid-cap fresher hiring runs through it.',
  },
  {
    id: 'internshala',
    name: 'Internshala',
    url: 'https://internshala.com/',
    linkCheck: CHECK_OK,
    kind: 'Interns & freshers',
    what: 'Internships and entry-level jobs. The realistic first channel if you have no prior work experience to put on a resume.',
  },
  {
    id: 'unstop',
    name: 'Unstop',
    url: 'https://unstop.com/',
    linkCheck: CHECK_OK,
    kind: 'Hiring challenges',
    what: 'Company-run coding contests and hackathons that double as hiring funnels — several companies recruit freshers here before opening a public listing.',
  },
  {
    id: 'instahyre',
    name: 'Instahyre',
    url: 'https://www.instahyre.com/',
    linkCheck: CHECK_OK,
    kind: 'Product companies',
    what: 'Curated, invite-style matching skewed toward Indian product companies and startups.',
  },
  {
    id: 'cutshort',
    name: 'Cutshort',
    url: 'https://cutshort.io/',
    linkCheck: CHECK_OK,
    kind: 'Product companies',
    what: 'Similar curated model — worth a profile if you are targeting product roles rather than service bands.',
  },
  {
    id: 'wellfound',
    name: 'Wellfound',
    url: 'https://wellfound.com/',
    linkCheck: CHECK_OK,
    kind: 'Startups',
    what: 'Startup roles, formerly AngelList Talent. Applications usually go straight to a founder or hiring lead.',
  },
  {
    id: 'workatastartup',
    name: 'Work at a Startup (YC)',
    url: 'https://www.workatastartup.com/',
    linkCheck: 'browser-only',
    kind: 'Startups',
    what: 'Y Combinator\'s own board, limited to YC companies. Small volume, unusually high signal.',
  },
  {
    id: 'indeed-in',
    name: 'Indeed India',
    url: 'https://in.indeed.com/',
    linkCheck: CHECK_OK,
    kind: 'General',
    what: 'Broad aggregator. Useful for coverage; always follow the listing back to the company\'s own careers page before applying.',
  },
  {
    id: 'glassdoor-in',
    name: 'Glassdoor India',
    url: 'https://www.glassdoor.co.in/',
    linkCheck: CHECK_OK,
    kind: 'Research',
    what: 'Not primarily an apply channel — use it to read interview experiences and salary bands for a company before you invest weeks preparing for it.',
  },
];

/** The stages an application can sit in. The DB CHECK constraint mirrors this list. */
export const APPLICATION_STAGES = [
  { id: 'applied',   label: 'Applied',   tone: 'neutral', hint: 'Submitted, no response yet' },
  { id: 'oa',        label: 'OA',        tone: 'info',    hint: 'Online assessment / coding test' },
  { id: 'interview', label: 'Interview', tone: 'accent',  hint: 'At least one interview round scheduled or done' },
  { id: 'offer',     label: 'Offer',     tone: 'success', hint: 'Offer received' },
  { id: 'rejected',  label: 'Rejected',  tone: 'danger',  hint: 'Closed — worth keeping for the pattern it shows' },
];

export const STAGE_IDS = APPLICATION_STAGES.map(s => s.id);

/** How the student applied. Mirrors the DB CHECK constraint on `source`. */
export const APPLICATION_SOURCES = [
  { id: 'off_campus', label: 'Off-campus' },
  { id: 'on_campus',  label: 'On-campus / TPO' },
  { id: 'referral',   label: 'Referral' },
  { id: 'other',      label: 'Other' },
];

export const SOURCE_IDS = APPLICATION_SOURCES.map(s => s.id);

/**
 * Build the directory.
 *
 * Companies come from COMPANY_PROFILES (the roadmap/readiness list). Entry-role
 * bands are read out of the existing lib/companiesData.js entry for the same
 * company — reused repo data, not new claims — and are simply absent for a
 * company that has no entry there.
 *
 * @returns {{companies: object[], portals: object[], generatedNote: string}}
 */
export function buildApplyDirectory() {
  const byName = new Map(COMPANIES.map(c => [c.name.toLowerCase(), c]));

  const companies = Object.keys(COMPANY_PROFILES).map(name => {
    const careers = CAREERS[name] || null;
    const existing = byName.get(name.toLowerCase()) || null;

    return {
      company: name,
      // The interview profile the roadmap and readiness score already use.
      profile: COMPANY_PROFILES[name],
      // Entry band, from lib/companiesData.js. null where that file has no row.
      entryRole: existing?.entryRole || null,
      companySlug: existing?.slug || null,
      tier: existing?.tier || null,
      logo: existing?.logo || '🏢',

      // Apply destination. null means we have no verified careers URL and the
      // UI must say so rather than linking somewhere plausible-looking.
      careersUrl: careers?.url || null,
      careersLabel: careers?.label || null,
      linkCheck: careers?.linkCheck || null,

      // Named ONLY where COMPANY_PROFILES already names the test.
      campusProgram: careers?.campusProgram || null,
    };
  });

  return {
    companies,
    portals: JOB_PORTALS,
    generatedNote:
      'A directory of where to apply — not a live job board. GENOIS does not read anyone\'s ' +
      'hiring system, so there are no deadlines, no open-role counts and no "currently hiring" ' +
      'flags anywhere on this page. Every link goes to the organisation\'s own careers domain.',
  };
}
