# Screeps Nix TypeScript Starter

## Motivation

This project strives to meet the following goals:

- Provide a reusable template any time I want to start over on my personal AI project
- Write in TypeScript using the [typed-screeps](https://github.com/screepers/typed-screeps) package
- Use modern tooling
  - Tools like Babel can translate the code back to being compatible
- Leverage Nix - specifically, [devenv](https://devenv.sh/)
  - Set up an isolated build environment automatically

## Notes

### Build Workflow

Screeps servers rely on Node 12. The build process needs to translate it back into older JS versions compatible with that version.

### Nixpkgs Version

This package uses Nixpkgs from the 24.11 bookmark. Rollup is marked as broken in 25.05 (see [nixpkgs PR #402567](https://github.com/NixOS/nixpkgs/pull/402567)), but anecdotally, I can confirm that the 24.11 version of nixpkgs appears to work as expected.

## References

- [screeps-typescript-starter](https://github.com/screepers/screeps-typescript-starter)
  - The main inspiration for this project
- [screeps-starter-rust](https://github.com/rustyscreeps/screeps-starter-rust)
  - Deployment scripts and logic
- First-party repos:
  - [screeps/screeps](https://github.com/screeps/screeps)
  - [screeps/engine](https://github.com/screeps/engine)
