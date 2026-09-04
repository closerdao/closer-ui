/**
 * What the objects on the GTM dashboard are, and how they relate.
 *
 * Written after a GTM hire's first hour with the board, where the first thing
 * they wanted was "a definition of a term" — applications and leads sit in
 * adjacent tabs and read as two views of the same list, so the reasonable guess
 * is that one gates the other. It does not, and guessing wrong changes how
 * someone works the pipeline.
 *
 * Long-form copy lives here rather than in the locale files, following
 * `firstSteps.ts`: these are paragraphs written to be read once and then not
 * again, and flattening them into translation keys costs their rhythm without
 * buying much. Only the chrome — the heading and the toggle — is translated.
 */

export interface GlossaryTerm {
  /** Stable id, used as a React key. */
  id: string;
  term: string;
  /** One sentence: what the object *is*. */
  definition: string;
  /** How it relates to the others — the part a tab label cannot carry. */
  relation: string;
}

export const LEADS_GLOSSARY: GlossaryTerm[] = [
  {
    id: 'application',
    term: 'Application',
    definition:
      'A form somebody filled in and sent. One row per submission, exactly as they typed it, including the answers to whatever questions this instance asks.',
    relation:
      'Raw inbound. It is the evidence, not the workspace: an application is never worked, it is read. Its status — open, in conversation, approved, rejected — is where an applicant stands with us.',
  },
  {
    id: 'lead',
    term: 'Lead',
    definition:
      'The working record the nightly job builds over an application, a village or a member: one per person or project, with a researched brief, a fit check and somewhere to put notes.',
    relation:
      'This is the thing you work. A lead gathers everything known about someone from every source, so several applications and a village can sit behind a single lead. Advancing one means changing the village or the application underneath it — the lead itself is a view, never the source of truth.',
  },
  {
    id: 'village',
    term: 'Village',
    definition:
      'A project record: a place, its land, its people and its stage of onboarding.',
    relation:
      'Created from a qualified village lead and kept as a private draft until someone publishes it, at which point it appears on the map. The draft is how we research a project without announcing it.',
  },
  {
    id: 'member',
    term: 'Member and subscription',
    definition: 'An account on the platform, and the plan it pays for.',
    relation:
      'A different stage, not a different gate. Applying and subscribing are unrelated steps — most subscribers never sent an application, and approving an application does not create a subscription. The applications tab is not a waiting list for signing up.',
  },
];

/**
 * The four questions on a village lead exist because they decide whether Closer
 * can deploy for a project at all. Stated here so the criteria are legible from
 * the board rather than only from the API that enforces them.
 */
export const LEADS_QUALIFICATION_BLURB =
  'A village lead is qualified by hand on four questions: is it a village, is the land owned, is a community forming, and are there ecological ambitions. One no rules the project out — nothing about launching a village is sent and the draft stays off the map — so record why you answered as you did, and what you checked to decide.';
