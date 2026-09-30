# RSD Bot

Production-oriented WhatsApp Cloud API bot with a Next.js admin dashboard, MongoDB persistence, optional OpenAI Responses API replies, webhook signature verification, duplicate-event protection, and human handoff support.

## What it does

- Receives WhatsApp Cloud API webhook events.
- Verifies Meta webhook signatures before processing messages.
- Stores contacts, conversations, and inbound/outbound messages in MongoDB.
- Deduplicates webhook deliveries using the WhatsApp message ID.
- Generates replies through the OpenAI Responses API when configured, with deterministic fallback replies when AI is unavailable.
- Respects human-handoff conversation state.
- Tracks the 24-hour customer-service window in conversation records.
- Sends text replies through the WhatsApp Cloud API.
- Provides a password-protected admin dashboard.
- Exposes a health endpoint for deployment checks.

## Stack

- Next.js 16 + React 19 + TypeScript
- Next.js App Router / Node.js route handlers
- WhatsApp Cloud API / Meta Graph API
- MongoDB
- Optional OpenAI Responses API
- Zod for validation
- Vercel-compatible deployment model

## Repository structure

    Rsd-bot/
    ├── app/
    │   ├── api/
    │   │   ├── auth/
    │   │   ├── health/
    │   │   └── webhook/whatsapp/
    │   ├── dashboard/
    │   ├── login/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── lib/
    │   ├── ai.ts
    │   ├── auth.ts
    │   ├── mongodb.ts
    │   └── whatsapp.ts
    ├── .env.example
    ├── package.json
    └── tsconfig.json

See docs/ARCHITECTURE.md for the request flow, data model, security boundaries, and scaling notes.

## Local setup

Requirements:

- Node.js compatible with the Next.js 16 project
- A MongoDB deployment or local MongoDB instance
- Meta WhatsApp Cloud API credentials for real webhook/message delivery
- Optional OpenAI API credentials for AI-generated replies

Install and run:

    npm install
    cp .env.example .env.local
    npm run dev

Open http://localhost:3000/login and authenticate with the ADMIN_PASSWORD configured in your local environment.

For production-oriented setup and webhook configuration, see CONTRIBUTING.md.

## Environment variables

The complete variable list is maintained in .env.example.

### WhatsApp / Meta

- WHATSAPP_GRAPH_VERSION
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_BUSINESS_ACCOUNT_ID
- WHATSAPP_VERIFY_TOKEN
- WHATSAPP_APP_SECRET

### MongoDB

- MONGODB_URI
- MONGODB_DB

### Admin authentication

- ADMIN_PASSWORD
- AUTH_SECRET

### Optional AI

- OPENAI_API_KEY
- OPENAI_MODEL

### Application URL

- NEXT_PUBLIC_APP_URL

Never commit real credentials or deployment secrets.

## Meta / WhatsApp webhook setup

1. Create/configure a Meta developer app with WhatsApp.
2. Obtain the WhatsApp Business Account, phone number ID, and access token.
3. Set WHATSAPP_GRAPH_VERSION to the Graph API version supported by your Meta app.
4. Set WHATSAPP_APP_SECRET to the Meta app secret.
5. Generate a private random WHATSAPP_VERIFY_TOKEN.
6. Deploy the application to a public HTTPS URL.
7. Configure the callback URL as:

    https://YOUR_DOMAIN/api/webhook/whatsapp

8. Use the exact same verification token in Meta and the deployment environment.
9. Subscribe the WhatsApp Business Account/app to the required message webhook events.

The GET webhook handler validates the verification token and returns Meta's challenge. The POST handler validates X-Hub-Signature-256 against the raw request body before parsing the event.

## Message processing flow

    WhatsApp Cloud API
            │
            ▼
    POST /api/webhook/whatsapp
            │
            ├── Verify X-Hub-Signature-256
            │
            ├── Ignore non-text / unsupported messages
            │
            ├── Deduplicate by WhatsApp message ID
            │
            ├── Upsert contact + conversation
            │
            ├── Store inbound message
            │
            ├── Human handoff? ── yes ──► acknowledge
            │
            ▼
       Generate reply
            │
            ├── OpenAI Responses API
            │
            └── deterministic fallback
            │
            ▼
    WhatsApp Cloud API
            │
            ▼
    Store outbound message

## Bot behavior

If an OpenAI API key is configured, lib/ai.ts sends the customer message to the configured OpenAI Responses API model. If the request fails or AI is not configured, the deterministic fallback handles greetings, product/pricing/support choices, and general handoff messaging.

Conversations marked human are acknowledged without an AI response.

The webhook records a 24-hour customer-service window from the latest inbound message. Business-initiated messaging outside Meta's permitted customer-service window should use an appropriate approved template; this application does not attempt to bypass Meta's policy controls.

## Security

- Webhook POST requests are authenticated with HMAC-SHA256 using WHATSAPP_APP_SECRET.
- Webhook signatures are compared using timing-safe comparison.
- Admin sessions are stored in an HTTP-only signed cookie.
- The session value includes a random nonce and a seven-day validity window.
- Secrets are read server-side from environment variables.
- Duplicate WhatsApp message IDs are ignored.
- The webhook does not process unsupported message types.
- The AI system prompt instructs the model not to claim actions that the system has not confirmed.

## Deployment

The project uses standard Next.js build and start scripts and is structured for Vercel-compatible Node.js deployment.

Production deployment checklist:

1. Configure every required environment variable.
2. Use strong, unique values for ADMIN_PASSWORD, AUTH_SECRET, and WHATSAPP_VERIFY_TOKEN.
3. Use least-privilege MongoDB credentials.
4. Deploy behind HTTPS.
5. Configure the Meta webhook callback.
6. Verify the GET challenge flow.
7. Send a test WhatsApp message and verify inbound/outbound records.
8. Monitor the health endpoint and deployment logs.

### Scaling note

The current webhook performs database writes, optional AI generation, and the outbound WhatsApp request during one request lifecycle. For higher traffic, move expensive message processing to a durable queue while keeping webhook acknowledgement fast. If multiple application instances are introduced, preserve idempotency and use shared persistence/coordination rather than process-local state.

## Scripts

| Command | Purpose |
|---|---|
| npm run dev | Start the Next.js development server |
| npm run build | Create a production build |
| npm start | Start the production Next.js server |
| npm run lint | Run the configured lint command |

## Documentation

- docs/ARCHITECTURE.md
- CONTRIBUTING.md
- CHANGELOG.md
- LICENSE

## License

This project is licensed under the MIT License. See LICENSE.

## Source of truth

Documentation describes the implementation currently present in the repository. It intentionally avoids claiming benchmarks, guaranteed throughput, or integrations that are not represented in the codebase.
