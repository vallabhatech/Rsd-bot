# RSD Bot

Production-oriented WhatsApp Cloud API bot with a Next.js admin dashboard, MongoDB persistence, optional AI replies, webhook signature verification, duplicate-event protection, and human handoff support.

## Stack

- Next.js + TypeScript
- WhatsApp Cloud API
- MongoDB Atlas
- Optional OpenAI-compatible Responses API
- Vercel-friendly Node.js route handlers

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/login` and use the `ADMIN_PASSWORD` from your local environment.

## Meta / WhatsApp setup

1. Create a Meta developer app and add WhatsApp.
2. Obtain a WhatsApp Business Account, phone number ID, and access token.
3. Set `WHATSAPP_GRAPH_VERSION` to the Graph API version supported by your Meta app.
4. Set `WHATSAPP_APP_SECRET` to the Meta app secret.
5. Set a private random `WHATSAPP_VERIFY_TOKEN`.
6. Deploy this app to a public HTTPS URL.
7. Configure the webhook callback as:

`https://YOUR_DOMAIN/api/webhook/whatsapp`

8. Use the exact same verify token in Meta and your environment.
9. Subscribe the WhatsApp Business Account/app to message webhook events.

## Production environment

Copy `.env.example` to your deployment's environment settings. Never commit `.env` or `.env.local`.

Recommended production values include:

- long random `AUTH_SECRET`
- strong unique `ADMIN_PASSWORD`
- production MongoDB URI with least-privilege credentials
- Meta system-user access token where appropriate
- current supported WhatsApp Graph API version
- HTTPS deployment

## Bot behavior

When a user messages the business number, the webhook stores the event and automatically replies. Messages are deduplicated using the WhatsApp message ID. Conversations marked `human` are not answered by the AI layer.

The 24-hour customer-service window is tracked in the conversation document. Business-initiated messages outside the allowed window must use an appropriate approved WhatsApp template; this project intentionally does not bypass Meta's policy controls.

## Security notes

- WhatsApp webhook requests are checked using `X-Hub-Signature-256` and the Meta app secret.
- Secrets are server-side only.
- Admin sessions use an HTTP-only signed cookie.
- Duplicate webhook deliveries are ignored.
- AI failure falls back to deterministic replies.

## Deployment

Deploy the repository to Vercel or another Node.js host, add all required environment variables, and set the Meta webhook URL to the deployed `/api/webhook/whatsapp` route.

For high traffic, move AI/message processing to a durable queue rather than doing expensive work directly inside the webhook request. Keep the webhook acknowledgement fast.

## Important

This project uses the official WhatsApp Cloud API. Do not replace it with WhatsApp Web automation, browser scraping, or unofficial session libraries for production business messaging.
