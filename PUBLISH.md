# Publishing to npm

This package is configured for public publish under `@rachelallyson/prisma-pothos-inputs`.

## Pre-publish checklist

- [ ] Update [CHANGELOG.md](CHANGELOG.md): move changes from `[Unreleased]` into a new `[x.y.z] - YYYY-MM-DD` section
- [ ] Bump version: `npm version patch` (or `minor` / `major`)
- [ ] Run tests: `npm test`
- [ ] Ensure docs are up to date (docs deploy from `main` on push)
- [ ] Log in: `npm login` (one-time per machine)

## Publish

```bash
npm publish
```

`prepublishOnly` runs `npm run build` before the tarball is created. Only `dist`, `README.md`, `LICENSE`, and `CHANGELOG.md` are included (see `files` in package.json).

## After publishing

- GitHub Releases (optional): create a release tag and paste the changelog
- Docs: already deployed from `main`; no extra step
