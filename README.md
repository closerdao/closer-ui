Welcome to [Closer](https://closer.earth/)!

This repository is created with a monorepo pattern and is built with a Turborepo - https://turbo.build/repo. The `apps` directory contains a few property apps that are deployed to [traditionaldreamfactory.com](traditionaldreamfactory.com) and other domains, and the `packages` directory that contains Closer package, which contains reusable components and logic.

### Apps:

- `tdf`: TDF Next.js application
...

### Packages:

- `closer`: Closer Next.js application
- `eslint-config-custom`: `eslint` configurations shared across all projects
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

### Run locally

Please, first find two files with the name.env.sample, clone them in the same directory (one in each app's directory, one in Closer) and rename to .env. Then, fill in the values for the variables (ask in the chat for secrets).

From root folder:

#### Install dependencies

```
yarn
```

#### Run one of the apps

CD to app's directory (e.g. apps/tdf), then

```
yarn dev
```

#### Test

CD to app's directory (e.g. apps/tdf or packages/closer), then

```
yarn test
```

### Build

To build all apps and packages, run the following command from the root:

```
yarn run build
```

To build a specific app or package, run the following command from the root:

CD to app's directory (e.g. apps/tdf), then

```
yarn build
```

### Installing packages 

Install packages in a respective app directory. Packages shared between apps should go to /packages/closer. CD into app directory, then

```
yarn -W add [package name]
```
Same for removing packages: 

```
yarn -W remove [package name]
```

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
