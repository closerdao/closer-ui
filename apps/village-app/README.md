# Village App

Generic deployable Closer app for a Village Deployment.

This app intentionally starts close to `apps/earthbound` so the first version can ship with low risk. Brand-specific content and duplicated shell code are tracked separately in `docs/village-app-plan.md`.

## Development

```bash
yarn workspace village-app dev
```

The homepage loads CMS content from the configured backend when available. If no homepage exists yet, it renders the Coming Soon State.
