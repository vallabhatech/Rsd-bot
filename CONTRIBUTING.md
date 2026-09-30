# Contributing to RSD Bot

Thanks for contributing. RSD Bot handles external webhooks, customer messages, authentication, database writes, AI requests, and outbound WhatsApp messages, so changes should preserve security and message-processing correctness.

## Development requirements

- Node.js compatible with the Next.js 16 project
- npm
- MongoDB for local persistence
- Meta WhatsApp Cloud API credentials when testing real messaging
- OpenAI API credentials only when testing AI-generated replies

## Setup

1. Clone the repository.
2. Install dependencies:

       npm install

3. Create local environment configuration:

       cp .env.example .env.local

4. Fill in the required MongoDB and admin authentication values.
5. Add Meta credentials when testing the WhatsApp webhook.
6. Add OPENAI_API_KEY only when testing the optional AI path.
7. Start development:

       npm run dev

The dashboard is available at http://localhost:3000/login.

## Webhook testing

The WhatsApp webhook lives at:

       /api/webhook/whatsapp

GET handles Meta webhook verification. POST validates X-Hub-Signature-256 against the raw request body before processing the event.

When testing webhook changes:

- Use a public HTTPS endpoint for Meta callbacks.
- Never disable signature verification just to make a test request pass.
- Test duplicate delivery using the same WhatsApp message ID.
- Test unsupported message types.
- Test the human-handoff state.
- Test the AI failure/fallback path.
- Confirm inbound and outbound records are written correctly.

## Code organization

- app/api: HTTP API and webhook route handlers
- app/dashboard: authenticated admin interface
- app/login: admin login UI
- lib/mongodb.ts: MongoDB connection helper
- lib/whatsapp.ts: WhatsApp Cloud API client
- lib/ai.ts: OpenAI Responses API integration and deterministic fallback
- lib/auth.ts: signed admin-session helpers

Keep external-service logic in lib modules rather than duplicating request logic across route handlers.

## Security expectations

Do not commit:

- .env or .env.local files
- WhatsApp access tokens
- Meta app secrets
- OpenAI API keys
- MongoDB credentials
- production admin passwords
- production authentication secrets

Security-sensitive changes should preserve:

- HMAC webhook verification
- timing-safe signature comparison
- HTTP-only admin cookies
- signed session values
- duplicate-event protection
- server-side secret handling

Never log access tokens, passwords, raw authorization headers, or unnecessary customer data.

## Database changes

MongoDB collections are created/updated by application code. If changing the document shape, update all readers and writers together and consider compatibility with existing records.

Be especially careful with:

- WhatsApp message IDs
- conversation status values
- customer-service window timestamps
- contact identifiers
- inbound/outbound message direction
- human handoff behavior

## AI changes

The AI layer is optional and must have a deterministic fallback.

When modifying lib/ai.ts:

- Keep the system prompt concise and support-oriented.
- Do not claim that an external action happened unless the application confirms it.
- Keep output bounded.
- Preserve the fallback path when the API key is absent or the provider fails.
- Avoid placing secrets or customer credentials into prompts.

## Pull requests

Before opening a PR:

1. Run the relevant checks.
2. Review the diff for accidental secrets.
3. Confirm documentation matches the implementation.
4. Explain any API, schema, security, or deployment impact.
5. Include screenshots for meaningful dashboard UI changes.
6. Keep unrelated refactors out of focused changes.

Recommended commit style:

- feat: new functionality
- fix: bug correction
- docs: documentation-only changes
- refactor: internal restructuring
- chore: maintenance
- security: security-focused hardening

## Validation

The package scripts currently provide:

       npm run lint
       npm run build

If a command cannot be run locally because external credentials or services are unavailable, state that limitation in the PR rather than claiming the check passed.

## Architecture-sensitive changes

Changes involving webhook processing, authentication, MongoDB persistence, WhatsApp API calls, AI generation, or deployment behavior should also update docs/ARCHITECTURE.md when the runtime design changes.

## License

By contributing, you agree that your contributions are provided under the repository's MIT License.
