Welcome to [traditionaldreamfactory.com](https://traditionaldreamfactory.com/)!

This repository is created with a monorepo pattern and is built with a Turborepo - https://turbo.build/repo. The `apps` directory contains `tdf` app that is deployed to traditionaldreamfactory.com, and the `packages` directory contains Closer package, that is deployed to [dev.closer.earth](dev.closer.earth).

### Apps:

- `tdf`: TDF Next.js application

### Packages:

- `closer`: Closer Next.js application
- `eslint-config-custom`: `eslint` configurations shared across all projects
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

### Deployments

Apps/Packages are deployed with Vercel:

- one for Closer app - https://closer-apps-closer.vercel.app/
- one for TDF app - https://closer-tdf.vercel.app/ (try "Sign in with Wallet" on `/login`, should work!)

### Run locally

Please, first find two files with the name.env.sample, clone them in the same directory (one in tdf, one in closer) and rename to .env. Then, fill in the values for the variables.

From root folder:

#### Install dependencies

```
yarn
```

#### Run both apps

```
yarn dev
```

#### Run only one app

```
yarn run dev --scope='<tdf | closer>'
```

### Build

To build all apps and packages, run the following command from the root:

```
yarn run build
```

To build a specific app or package, run the following command from the root:

```
yarn run build --scope='<tdf | closer>'
```

TDF build depends on Closer build and turborepo is smart enough to build Closer first.

### Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your turborepo:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
