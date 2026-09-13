import { VILLAGE_COLLECTION } from '../constants/village.constants';
import { Lead } from '../types/lead';
import { LngLat, Village, VillageCriteria } from '../types/village';
import api, { formatSearch } from './api';
import { leadDisplayName, leadOwnerIds } from './leads.helpers';

/**
 * An application as the dashboard reads it. `name`, `email` and `phone` are
 * columns on the model; everything else the platform asks for lands in the
 * free-form `fields` object — see `ApplicationsConfig`.
 */
export interface Application {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  created?: string;
  fields?: Record<string, unknown>;
  links?: ApplicationLinks;
  [key: string]: unknown;
}

/**
 * Where an application led, written server-side by the leads sync from the
 * relationships it already resolves. Team-readable only, so a public reader
 * never sees it. Slugs ride along so a link needs no second fetch.
 */
export interface ApplicationLinks {
  lead?: string;
  village?: string;
  villageSlug?: string;
  user?: string;
  userSlug?: string;
  updated?: string;
}

export interface ApplicationLinkHrefs {
  village?: string;
  lead?: string;
  user?: string;
}

const asId = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  // Ids may arrive as ObjectId-like objects depending on the serializer.
  if (value && typeof value === 'object' && 'toString' in value) {
    const text = String(value);
    return text && text !== '[object Object]' ? text : undefined;
  }
  return undefined;
};

/**
 * The related records a team member can jump to from an application card.
 * A missing link simply yields no href — nothing is guessed. The lead board
 * has no per-lead route, so the lead href opens the board on that lead.
 */
export function getApplicationLinkHrefs(
  application: Pick<Application, 'links'>,
): ApplicationLinkHrefs {
  const links = application.links || {};
  const hrefs: ApplicationLinkHrefs = {};

  const village = asId(links.villageSlug) || asId(links.village);
  if (village) hrefs.village = `/villages/${encodeURIComponent(village)}`;

  const lead = asId(links.lead);
  if (lead)
    hrefs.lead = `/dashboard/leads/all?lead=${encodeURIComponent(lead)}`;

  // `/user/:id` on the API resolves a slug or an id, so either works here.
  const user = asId(links.userSlug) || asId(links.user);
  if (user) hrefs.user = `/members/${encodeURIComponent(user)}`;

  return hrefs;
}

export async function fetchApplication(
  id: string,
): Promise<Application | null> {
  try {
    const { data } = await api.get(`/application/${id}`);
    const result = data?.results || data;
    return result?._id ? (result as Application) : null;
  } catch {
    return null;
  }
}

/**
 * The villages already created from a batch of applications, keyed by the
 * application they came from. Used to swap "create village" for "view village"
 * in the application list.
 */
export async function fetchVillagesByApplicationIds(
  applicationIds: string[],
): Promise<Record<string, Village>> {
  if (applicationIds.length === 0) return {};
  try {
    const where = formatSearch({ applicationId: { $in: applicationIds } });
    const { data } = await api.get(`/${VILLAGE_COLLECTION}?where=${where}`, {
      params: { limit: applicationIds.length },
    });
    const results = data?.results || data;
    if (!Array.isArray(results)) return {};
    return (results as Village[]).reduce((acc, village) => {
      // First match wins: a second village pointing at the same application is
      // a data error, and the list only has room for one link either way.
      if (village.applicationId && !acc[village.applicationId]) {
        acc[village.applicationId] = village;
      }
      return acc;
    }, {} as Record<string, Village>);
  } catch {
    return {};
  }
}

/** `fields` keys are authored per platform, so match them loosely. */
const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

const NAME_KEYS = [
  'villagename',
  'projectname',
  'communityname',
  'projectcommunityname',
  'nameoftheproject',
  'nameofyourproject',
  'project',
  'community',
];

const DESCRIPTION_KEYS = [
  'description',
  'projectdescription',
  'about',
  'aboutproject',
  'aboutyourproject',
  'summary',
  'vision',
  'story',
  'dream',
];

const COUNTRY_KEYS = ['country', 'projectcountry', 'wherearyoubased'];

const WEBSITE_KEYS = [
  'website',
  'projectwebsite',
  'websiteurl',
  'url',
  'link',
  'site',
  'webpage',
  // "Link to your website or deck" and the ways an operator may rename it.
  'deck',
  'pitchdeck',
  'websitedeck',
  'websiteordeck',
  'linktowebsiteordeck',
  'linktoyourwebsiteordeck',
  'projectlink',
  'projecturl',
];

const TAGS_KEYS = ['tags', 'keywords', 'focus', 'themes'];

const EMAIL_KEYS = ['email', 'contactemail', 'projectemail'];
const PHONE_KEYS = ['phone', 'contactphone', 'whatsapp', 'telephone'];

const INSTAGRAM_KEYS = ['instagram', 'instagramhandle', 'ig'];
const TWITTER_KEYS = ['twitter', 'twitterhandle', 'x'];
const FACEBOOK_KEYS = ['facebook', 'facebookpage', 'fb'];

const LAT_KEYS = ['lat', 'latitude'];
const LNG_KEYS = ['lng', 'lon', 'long', 'longitude'];

/**
 * Flattens the application into one lookup keyed by normalized field name, so
 * a question can be answered by either a model column or a `fields` entry.
 * Model columns are added last and win: `email` on the record is the address
 * the applicant is reachable at.
 */
const indexAnswers = (application: Application): Record<string, unknown> => {
  const index: Record<string, unknown> = {};
  Object.entries(application.fields || {}).forEach(([key, value]) => {
    index[normalizeKey(key)] = value;
  });
  (['name', 'email', 'phone'] as const).forEach((key) => {
    if (application[key]) index[key] = application[key];
  });
  return index;
};

const pickString = (
  answers: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = answers[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
};

const pickNumber = (
  answers: Record<string, unknown>,
  keys: string[],
): number | undefined => {
  const value = pickString(answers, keys);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickTags = (answers: Record<string, unknown>): string[] | undefined => {
  for (const key of TAGS_KEYS) {
    const value = answers[key];
    if (Array.isArray(value)) {
      const tags = value
        .map(String)
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (tags.length > 0) return tags;
    }
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }
  return undefined;
};

/**
 * Turns an application into the `initial` a `VillageForm` opens on. Free-form
 * answers are matched by key rather than by a fixed schema, so an application
 * that asked none of these questions simply yields an emptier form — nothing
 * here is guessed from prose.
 *
 * `coords` comes back in GeoJSON order like every other API village, because
 * `VillageForm` converts `initial.coords` on the way in.
 */
export function applicationToVillage(
  application: Application,
): Partial<Village> {
  const answers = indexAnswers(application);

  const lat = pickNumber(answers, LAT_KEYS);
  const lng = pickNumber(answers, LNG_KEYS);
  const hasCoords =
    lat !== undefined &&
    lng !== undefined &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;

  const instagram = pickString(answers, INSTAGRAM_KEYS);
  const twitter = pickString(answers, TWITTER_KEYS);
  const facebook = pickString(answers, FACEBOOK_KEYS);

  const village: Partial<Village> = {
    applicationId: application._id,
    // The applicant's own name is the last resort — most platforms ask for the
    // project name in a custom field, but an operator can always rename it.
    name: pickString(answers, NAME_KEYS) || application.name,
    description: pickString(answers, DESCRIPTION_KEYS),
    country: pickString(answers, COUNTRY_KEYS),
    website: pickString(answers, WEBSITE_KEYS),
    tags: pickTags(answers),
    contact: {
      email: pickString(answers, EMAIL_KEYS),
      phone: pickString(answers, PHONE_KEYS),
      ...(instagram || twitter || facebook
        ? { social: { instagram, twitter, facebook } }
        : {}),
    },
    ...(hasCoords ? { coords: [lng, lat] as LngLat } : {}),
  };

  // Undefined keys would override nothing, but dropping them keeps the object
  // readable in tests and in the network payload.
  (Object.keys(village) as (keyof Village)[]).forEach((key) => {
    if (village[key] === undefined) delete village[key];
  });

  return village;
}

/**
 * What a lead adds to the village the team drafts for it: the person as the
 * project manager (so the owner invite has an address), the assigned
 * ambassadors as managers (so they can read the draft), and the match
 * criteria copied onto the fit checklist where they overlap. Nothing here
 * overrides what the application already said — `applicationToVillage` runs
 * first and this fills the gaps.
 */
export function leadToVillage(lead: Lead): Partial<Village> {
  const qualification = lead.qualification || {};
  const criteria: VillageCriteria = {};
  if (typeof qualification.isVillage === 'boolean') {
    criteria.landBased = qualification.isVillage;
  }
  if (typeof qualification.landOwned === 'boolean') {
    criteria.hasLand = qualification.landOwned;
  }
  if (typeof qualification.ecologicalAmbition === 'boolean') {
    criteria.ecologicalFocus = qualification.ecologicalAmbition;
  }

  const name = leadDisplayName(lead);
  const email = lead.email?.trim();
  const village: Partial<Village> = {
    ...(Object.keys(criteria).length > 0 ? { criteria } : {}),
    ...(name || email
      ? {
          projectManager: {
            ...(name && name !== email ? { name } : {}),
            ...(email ? { email } : {}),
          },
        }
      : {}),
    ...(leadOwnerIds(lead).length > 0 ? { managedBy: leadOwnerIds(lead) } : {}),
  };
  return village;
}
