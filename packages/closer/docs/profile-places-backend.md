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

```json
{ "settings": { "homes": [ /* full replacement array */ ] } }
```

```json
{ "settings": { "upcomingVisits": [ /* full replacement array */ ] } }
```

Please **merge** into `settings` (same as `newsletter_weekly`) rather than
replacing the whole settings object, so other keys are preserved.

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
