# Profile homes & upcoming visits — backend notes

The UI stores both features on the user document under `settings`, via the
existing `PATCH /user/:id` path.

## Fields

| Path | Shape | Purpose |
| --- | --- | --- |
| `settings.homes` | `UserHome[]` | Places the member returns to regularly |
| `settings.upcomingVisits` | `UpcomingVisit[]` | Planned places + dates |

```jsonc
// settings.homes[]
{
  "id": "uuid",
  "name": "Lisbon",
  "geojson": {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-9.1393, 38.7223] }, // [lng, lat]
    "properties": {
      "name": "Lisbon",
      "name_long": "Lisbon, Portugal"
    }
  },
  "visibility": "all" // or "citizen"
}

// settings.upcomingVisits[]
{
  "id": "uuid",
  "name": "Berlin",
  "geojson": {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [13.405, 52.52] },
    "properties": { "name": "Berlin", "name_long": "Berlin, Germany" }
  },
  "startDate": "2026-09-12", // YYYY-MM-DD
  "endDate": "2026-09-20",   // optional
  "visibility": "citizen"
}
```

## Patch payloads the UI sends

`PATCH /user/:id` replaces `settings` wholesale — it does not deep merge — so
the UI sends the member's **whole** settings object with the changed keys
folded in, built by `mergeUserSettings()`
(`packages/closer/utils/userSettings.helpers.ts`):

```json
{
  "settings": {
    "newsletter_weekly": true,
    "push_notifications_enabled": false,
    "homes": [ /* full replacement array */ ]
  }
}
```

Both `homes` and `upcomingVisits` are full-replacement arrays inside that
object.

**Ask:** deep-merge `settings` server-side instead. Until then every writer has
to round-trip the whole object, so two concurrent savers (e.g. the push
notification context and the settings page) can still clobber each other's key.

## Privacy (`visibility`)

| Value | Intended audience |
| --- | --- |
| `all` | Anyone who can see the member profile |
| `citizen` | Profile owner, plus viewers with role `citizen`, `member`, or `admin` |

The UI filters on read. **Ask:** also filter on `GET /user/:slug` (and any
public user serializers) so citizen-only geojson never leaves the API for
unauthorized viewers. Owners and admins should still receive the full arrays.

## Validation suggested server-side

- `homes` / `upcomingVisits` are arrays (cap e.g. 20 items each)
- each item has `id`, `name`, `visibility ∈ {all,citizen}`
- `geojson` is a GeoJSON `Feature` with `Point` geometry when present
- `upcomingVisits[].startDate` required ISO date; `endDate` optional and ≥ start
