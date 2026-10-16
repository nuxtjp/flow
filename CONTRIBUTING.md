# Contributing

Thanks for helping improve `@nuxtjp/flow`. English and Japanese reports are
welcome. This is a community-maintained project, independent of the Nuxt
and Vue Flow maintainers.

## Before starting

- Search existing issues and pull requests for related work.
- Discuss substantial API or dependency changes before implementing them.
- For security concerns, follow [SECURITY.md](SECURITY.md).
- Use synthetic examples. Do not include credentials or confidential data.

## Project boundaries

The module owns Nuxt registration, CSS setup, the client-only graph boundary,
and lifecycle integration. Vue Flow owns the graph engine, interaction
behavior, node/edge primitives, and graph types. Prefer using upstream
features over introducing parallel implementations.

Keep optional Vue Flow extensions optional. Avoid introducing application
storage, backend services, or domain-specific node schemas into the module.

## Development

Use Node.js ≥ 22.12 and npm. From a source checkout, run:

```sh
npm ci
npm run dev:prepare
npm run dev
```

Before submitting changes, run `npm run check` for lint, type checks, tests,
and the package build. `npm pack` creates a local installable tarball.
See the `scripts` field in `package.json` for focused test commands.

Work from a local checkout, prepare the module, and run the playground before
changing runtime behavior. Test the built package as well as the source:
package exports, generated types, and runtime assets must work from an
installed tarball.

## Verification checklist

- Keep changes focused and add a regression test for the behavior changed.
- Run the repository's type checks, tests, and build.
- Check SSR output and static generation, not only client navigation.
- Test two graphs together and confirm their state and callbacks stay separate.
- Test mount, unmount, repeated navigation, and KeepAlive reactivation.
- Cover cancellation while asynchronous graph work is still pending.
- Verify CSS defaults and opt-out settings when changing module registration.
- Keep the English and Japanese READMEs consistent for public API changes.

If a check cannot run, state exactly which check and why in the pull request.
Do not describe unexecuted checks as passing.

## Pull requests

Explain the problem, the chosen solution, and how it was verified. Include
a minimal reproduction or screenshots when they help review. Identify
breaking changes and migration steps explicitly.

Keep source files and documentation small enough to review independently;
prefer focused modules and linked guides over a single oversized file.
Retain license notices when incorporating third-party code.

## License

Contributions are provided under the project's [MIT license](LICENSE).
Dependencies retain their own licenses and copyright notices.
