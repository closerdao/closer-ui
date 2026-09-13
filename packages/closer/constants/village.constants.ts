export const VILLAGE_COLLECTION = 'village';

export const VILLAGE_STATUSES = [
  'planning',
  'active',
  'paused',
  'completed',
  'cancelled',
] as const;

export const VILLAGE_VERIFICATION_BADGES = [
  'unverified',
  'pending',
  'verified',
  'resonant',
] as const;

/**
 * In pipeline order — index comparisons against it decide whether the slug has
 * frozen, so nothing may be reordered without checking `isVillageSlugFrozen`.
 * Mirrors `ONBOARDING_STATUSES` in closer-api's village model.
 */
export const VILLAGE_ONBOARDING_STATUSES = [
  'map_only',
  'pre_assessed',
  'intro_scheduled',
  'subscribed',
  'deploy_requested',
  'deploying',
  'failed',
  'live',
  'suspended',
  'retired',
] as const;

/**
 * Statuses procurement owns. An admin cannot move a village *into* these by
 * hand — only the deploy route (→ `deploy_requested`) and procurement's own
 * writes (→ `deploying`) do, and the API rejects a PATCH that tries.
 */
export const VILLAGE_PROCUREMENT_ONLY_STATUSES = [
  'deploy_requested',
  'deploying',
] as const;

/**
 * Deployment outcomes. On a *managed* village procurement owns them — its
 * reconciler rewrites the status within a minute, so offering an admin the
 * control would be a lie. On an unmanaged village (one already running Closer
 * that procurement never provisioned, e.g. TDF) `live` is precisely how an
 * admin records the fact, so they stay hand-settable there. Gate with
 * `villageAdminSettableStatuses`, never by removing them outright.
 */
export const VILLAGE_MANAGED_ONLY_STATUSES = [
  'failed',
  'live',
  'suspended',
] as const;

/**
 * `retired` is written only by procurement's soft-delete write-back (ADR
 * 0023 §1) and undone only by a Redeploy, on managed and unmanaged villages
 * alike — there is no hand-typed equivalent, unlike `live`/`suspended` on an
 * unmanaged row. Kept out of the admin-settable set entirely rather than
 * gated by `managed`.
 */
const VILLAGE_NEVER_ADMIN_SETTABLE_STATUSES = ['retired'] as const;

/** Hand-settable on an unmanaged village. Narrow with `villageAdminSettableStatuses`. */
export const VILLAGE_ADMIN_SETTABLE_STATUSES =
  VILLAGE_ONBOARDING_STATUSES.filter(
    (status) =>
      !(VILLAGE_PROCUREMENT_ONLY_STATUSES as readonly string[]).includes(
        status,
      ) &&
      !(VILLAGE_NEVER_ADMIN_SETTABLE_STATUSES as readonly string[]).includes(
        status,
      ),
  );

/**
 * The one status that means a village is serving on Closer right now. This is
 * the single source of truth for "is this an active Closer deploy" — the legacy
 * `closer` boolean on the Village record is deprecated, see `isVillageDeployed`.
 *
 * `failed` and `suspended` are deployments too, just not ones that are up.
 */
export const VILLAGE_DEPLOYED_STATUS = 'live';

/** From this status onwards the slug is procurement's join key and cannot move. */
export const VILLAGE_SLUG_FROZEN_FROM = 'deploy_requested';

/**
 * Roles that may press Deploy on any village. A village's own `managedBy`
 * members and its founder (`createdBy`) may too.
 */
export const VILLAGE_DEPLOYER_ROLES = ['team', 'admin'];

/**
 * Suspend / reactivate / retire (ADR 0023 §3) are admin | team only — the
 * same set as `VILLAGE_DEPLOYER_ROLES`, given its own name because the two
 * are allowed to diverge: a village's own `managedBy` ambassador and its
 * founder may press Deploy but not these, since they are destructive
 * platform actions, not an onboarding step.
 */
export const VILLAGE_LIFECYCLE_ROLES: readonly string[] = VILLAGE_DEPLOYER_ROLES;

export const PLATFORM_SUBSCRIPTION_PRICE_EUR = 49;
export const PLATFORM_SETUP_FEE_EUR = 0;
export const TIER2_SETUP_FEE_EUR = 5000;

export const HARD_CRITERIA_FIELDS = [
  'landBased',
  'hasLand',
  'peopleOnLand',
  'operationalized',
  'notTechnophobic',
] as const;

export const PEOPLE_COUNT_MIN = 10;
export const PEOPLE_COUNT_MAX = 500;
export const ROOMS_COUNT_MIN = 10;
export const MONTHLY_VOLUME_SOFT_MIN = 5000;
export const MONTHLY_VOLUME_SOFT_MAX = 20000;

export const AMBASSADOR_ROLE = 'ambassador';

/**
 * What an Ambassador earns on a federation hub: a flat share of Closer's own
 * revenue from every village they maintain, for as long as it runs on Closer.
 * Flat by design — the per-type `AffiliateConfig` percentages belong to a
 * community running its own affiliate program, not to the hub.
 */
export const AMBASSADOR_REVENUE_SHARE_PERCENT = 5;

/**
 * Roles allowed to see the internal parts of the village form — the fit
 * checklist and the project manager card. Village owners edit their listing
 * without either.
 */
export const VILLAGE_REVIEWER_ROLES = ['team', 'admin', AMBASSADOR_ROLE];
