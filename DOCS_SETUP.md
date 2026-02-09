# Documentation Site Setup

The docs site uses [Nextra](https://nextra.site/) with the docs theme and deploys to GitHub Pages.

## Quick start

### Local development

```bash
# From repo root: install docs dependencies (one-time)
cd docs && npm install && cd ..

# Start dev server
npm run docs:dev
```

Visit http://localhost:3000 (or with base path, http://localhost:3000/prisma-pothos-inputs in production build).

### Build documentation

```bash
npm run docs:build
```

Generates static site in `docs/out/`.

## Structure

```
docs/
├── content/           # MDX source (committed)
│   ├── _meta.json    # Sidebar order
│   ├── index.mdx
│   ├── getting-started.mdx
│   ├── api-reference.mdx
│   ├── examples.mdx
│   └── type-mapping.mdx
├── app/              # Next.js App Router (layout, mdx route)
├── next.config.mjs   # Nextra + static export
├── theme.config.tsx  # Logo, sidebar, search
└── package.json      # Docs dependencies (next, nextra, nextra-theme-docs)
```

## Deployment

The site deploys to GitHub Pages when:

- Changes are pushed to `main` in `docs/`, `src/`, or `package.json`
- The workflow is triggered manually (Actions → Deploy Docs → Run workflow)

Configure GitHub Pages for this repo: **Settings → Pages → Source: GitHub Actions**. The workflow uses `BASE_PATH: /prisma-pothos-inputs` so the site is served at `https://<user>.github.io/prisma-pothos-inputs/` (or your repo name). If your repo name differs, set `BASE_PATH` in `.github/workflows/docs.yml` and in `docs/next.config.mjs` to match.

## Editing content

Edit the `.mdx` files in `docs/content/`. Update `_meta.json` to change sidebar order or titles. Run `npm run docs:dev` to preview.
