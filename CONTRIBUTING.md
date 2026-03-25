# Contributing to DesignLint

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/MukundaKatta/DesignLint.git
cd DesignLint
npm install
npm run build
npm test
```

## Adding a New Rule

1. Define the rule config in `src/config.ts` under `DesignLintConfig.rules`.
2. Implement the rule method in `src/core.ts` following the existing pattern.
3. Call it from `DesignLinter.lint()` gated by the `enabled` flag.
4. Add test cases in `tests/core.test.ts`.

## Code Style

- TypeScript strict mode is enforced.
- Keep functions small and focused.
- Every rule method returns `LintIssue[]`.

## Pull Requests

- Create a feature branch from `main`.
- Ensure `npm run lint`, `npm run build`, and `npm test` all pass.
- Write clear commit messages.
- One feature or fix per PR.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
