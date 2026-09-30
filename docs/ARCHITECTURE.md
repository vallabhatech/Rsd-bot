# Architecture

## Overview

RSD Bot is a Next.js application that connects the WhatsApp Cloud API to a MongoDB-backed conversation store, an optional OpenAI Responses API integration, and a password-protected admin dashboard.

The main runtime boundary is the Next.js App Router. API route handlers receive webhook/auth/health requests, while shared service modules isolate MongoDB, WhatsApp, AI, and admin-session behavior.

## High-level flow

    WhatsApp Cloud API
            │
            ▼
    Next.js webhook route
            │
       signature check
            │
       event extraction
            │
       duplicate check
            │
       MongoDB persistence
            │
       conversation state
            │
       ┌────┴────┐
       │         │
     human       AI
       │         │
       │     OpenAI Responses API
       │         │
       │     fallback reply
       │         │
       └────┬────┘
            │
            ▼
    WhatsApp Cloud API
            │
            ▼
    outbound message record

The admin dashboard is a separate request path using the signed admin session cookie.

## Application structure

### app/

The App Router contains the user-facing pages and HTTP endpoints.

- app/page.tsx: application entry point
- app/login/: admin login page
- app/dashboard/: authenticated dashboard
- app/api/auth/: admin authentication endpoint(s)
- app/api/health/: health endpoint
- app/api/webhook/whatsapp/: Meta WhatsApp webhook

### lib/

Shared server-side integration modules:

- lib/mongodb.ts: MongoDB connection access
- lib/whatsapp.ts: WhatsApp Cloud API text-message client
- lib/ai.ts: optional OpenAI Responses API integration and fallback replies
- lib/auth.ts: signed admin-session creation and validation

## WhatsApp webhook

The webhook route exposes:

    GET /api/webhook/whatsapp

for Meta webhook verification and:

    POST /api/webhook/whatsapp

for message events.

### Verification

The GET handler checks Meta's subscribe mode and compares the supplied verification token with WHATSAPP_VERIFY_TOKEN.

The POST handler reads the raw request body first. It calculates HMAC-SHA256 using WHATSAPP_APP_SECRET and compares the supplied X-Hub-Signature-256 value with a timing-safe comparison.

Only after signature verification does the handler parse the JSON payload.

### Event processing

For a supported text message, the handler:

1. Extracts sender, message ID, profile name, and text body.
2. Upserts the contact.
3. Creates or updates an open conversation.
4. Calculates the 24-hour customer-service window.
5. Checks whether the WhatsApp message ID was already stored.
6. Stores the inbound message.
7. Stops automated replies when the conversation is in human mode.
8. Generates a reply through the AI layer or deterministic fallback.
9. Sends the reply through the WhatsApp Cloud API.
10. Stores the outbound message.
11. Updates conversation timestamps.

Unsupported or incomplete events are acknowledged without attempting to send a response.

## Persistence model

MongoDB is the persistence layer. The webhook currently uses three logical collections:

### contacts

Tracks WhatsApp contacts, including:

- WhatsApp identifier
- phone number
- profile name
- opt-in state
- last-message timestamp
- creation/update timestamps

### conversations

Tracks the active conversation for a contact, including:

- contact reference
- status
- last-message timestamp
- customer-service window expiry
- creation/update timestamps

The implementation recognizes an open conversation and a human-handoff state.

### messages

Stores inbound and outbound message records, including:

- conversation reference
- WhatsApp message ID
- direction
- message type
- body
- status
- timestamps

The WhatsApp message ID provides the current duplicate-delivery guard.

## AI layer

lib/ai.ts is optional.

When OPENAI_API_KEY is available, the application calls the OpenAI Responses API using OPENAI_MODEL or its configured default.

The request contains a support-oriented system instruction and the customer message. The response is limited by a maximum output token setting.

If the provider is unavailable, returns a non-success response, or produces unusable output, the application uses deterministic fallback responses instead of failing the complete message flow.

This fallback is important because the WhatsApp integration must remain usable without a working AI provider.

## WhatsApp outbound integration

lib/whatsapp.ts calls the Meta Graph API using:

- WHATSAPP_GRAPH_VERSION
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID

The current outbound helper sends individual text messages and returns the API response. HTTP failures are surfaced to the webhook handler.

## Authentication

Admin authentication uses a signed cookie rather than a third-party identity provider.

lib/auth.ts:

1. Requires AUTH_SECRET.
2. Generates a timestamp and cryptographically random nonce.
3. Signs the timestamp/nonce pair with HMAC-SHA256.
4. Stores the resulting value in the admin session cookie.
5. Validates the signature with a timing-safe comparison.
6. Expires sessions after seven days.

The dashboard and auth route use this helper to protect administrative access.

## Security boundaries

### Secrets

All provider credentials are environment variables and must remain server-side.

### Webhook trust

The webhook does not trust a request merely because it reaches the public endpoint. POST payloads require a valid Meta HMAC signature.

### Idempotency

WhatsApp message IDs are checked before inserting inbound messages, preventing duplicate webhook deliveries from being processed twice.

### Human handoff

A conversation in human status is acknowledged but does not trigger the automated AI reply path.

### Policy boundary

The application records the customer-service window but does not attempt to bypass WhatsApp/Meta messaging policies or template requirements.

## Deployment

The package scripts use the normal Next.js deployment lifecycle:

- npm run build
- npm start

The project is structured for Vercel-compatible Node.js deployment. A public HTTPS URL is required for Meta webhook delivery.

## Scaling considerations

The current POST webhook performs persistence, optional AI generation, and outbound WhatsApp delivery in one request lifecycle. This is simple and appropriate for the current implementation, but it creates a natural scaling boundary.

For larger workloads, consider:

1. A durable queue between webhook acknowledgement and message processing.
2. Fast webhook acknowledgement followed by asynchronous work.
3. MongoDB indexes for WhatsApp message IDs and frequently queried conversation/contact fields.
4. Explicit idempotency keys for outbound operations.
5. Retry/backoff handling for temporary provider failures.
6. Rate limiting for admin/auth endpoints.
7. Structured logging and request correlation IDs.
8. Centralized error monitoring.
9. Shared persistence/coordination when multiple application instances run concurrently.

These are architecture directions, not claims that the repository already implements them.

## Change checklist

When changing webhook behavior:

- preserve raw-body signature verification
- preserve duplicate-event protection
- test malformed and unsupported events
- test human handoff
- verify inbound/outbound persistence
- consider Meta policy constraints

When changing authentication:

- never weaken session signing
- keep cookies HTTP-only and secure in production
- avoid logging credentials or session values
- review session expiry behavior

When changing external integrations:

- keep secrets in environment variables
- handle non-success provider responses
- preserve deterministic fallback behavior where applicable
- update .env.example and README when configuration changes

## Source of truth

The repository source code is authoritative. This document explains the current structure and records future scaling directions without asserting unimplemented guarantees.
