# Contributing to DesignLint

## Development Setup

```bash
git clone https://github.com/MukundaKatta/DesignLint.git
cd DesignLint
npm install
npm run build
npm test
```

## Adding a New Rule

1. Add the rule config (with any knobs) to `src/config.ts` under `DesignLintConfig.rules`.
2. Create `src/rules/<your-rule>.ts` exporting a `Rule` function. Reuse helpers in `parse.ts` and `utils.ts`.
3. Register it in `src/rules/index.ts` `ALL_RULES` array.
4. Add at least one positive test (rule fires) and one negative (rule does not fire when compliant) in `tests/core.test.ts`.
5. Update the rules table in the README.

## Autofixes

Rules that produce an autofix return a `fix` object with `start`/`end` byte offsets into the original source plus a `replacement` string. Use parse5 source-code-location info (see `image-alt.ts` and `viewport-meta.ts`) rather than regex to locate offsets. The global `applyFixes()` handles non-overlapping merge.

## Code Style

- TypeScript strict mode is enforced.
- Keep rule files small (one file per rule).
- No new runtime dependencies without discussion.

## Pull Requests

- Branch from `main`.
- Include tests for anything that changes behavior.
- Run `npm test` + `npm run build` locally before pushing.
- Keep PRs atomic — one rule or one fix per PR.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
