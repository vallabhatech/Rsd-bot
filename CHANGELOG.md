# Changelog

All notable repository changes are documented here.

## [Unreleased]

### Documentation

- Keep project documentation aligned with the current Next.js, MongoDB, WhatsApp Cloud API, authentication, and AI implementation.
- Future production hardening should document queueing, observability, rate limiting, and multi-instance coordination when those capabilities are actually implemented.

## [2026-09-30]

### Documentation

- Refreshed README with current project capabilities, setup, webhook flow, security notes, deployment guidance, and repository structure.
- Added an architecture guide covering runtime boundaries, message processing, persistence, authentication, external services, and scaling considerations.
- Added contributor guidance for local setup, webhook testing, security, database changes, AI changes, and validation.
- Added an MIT license.

### Accuracy

- Documentation describes behavior represented in the source tree.
- No benchmark, throughput, uptime, or concurrency guarantees are claimed.
- Scaling recommendations are presented as future hardening directions unless already implemented.

## Historical implementation

The repository history contains the earlier implementation work for the WhatsApp webhook, admin authentication, dashboard, production setup, and dashboard entry redirect. The changelog does not duplicate every historical commit; Git history remains the authoritative record for individual implementation changes.
