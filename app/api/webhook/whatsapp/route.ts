import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { sendText } from "@/lib/whatsapp";
import { generateReply } from "@/lib/ai";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signature.slice(7);
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (
    url.searchParams.get("hub.mode") === "subscribe" &&
    url.searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(raw);
  const change = payload.entry?.[0]?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  if (!message) return NextResponse.json({ received: true });

  const from = message.from as string | undefined;
  const messageId = message.id as string | undefined;
  const name = value?.contacts?.[0]?.profile?.name as string | undefined;
  const body = message.type === "text" ? message.text?.body : undefined;
  if (!from || !messageId || !body) return NextResponse.json({ received: true });

  const database = await db();
  const messages = database.collection("messages");
  const conversations = database.collection("conversations");
  const contacts = database.collection("contacts");

  const existing = await messages.findOne({ whatsappMessageId: messageId });
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  const now = new Date();
  await contacts.updateOne(
    { whatsappId: from },
    { $set: { phoneNumber: from, name, whatsappId: from, lastMessageAt: now, updatedAt: now }, $setOnInsert: { createdAt: now, optedIn: true } },
    { upsert: true },
  );

  const contact = await contacts.findOne({ whatsappId: from });
  if (!contact) return NextResponse.json({ received: true });

  const windowUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const conversation = await conversations.findOneAndUpdate(
    { contactId: contact._id, status: { $ne: "closed" } },
    { $set: { lastMessageAt: now, customerServiceWindowUntil: windowUntil, updatedAt: now }, $setOnInsert: { contactId: contact._id, status: "open", createdAt: now } },
    { upsert: true, returnDocument: "after" },
  );

  await messages.insertOne({ conversationId: conversation?._id, whatsappMessageId: messageId, direction: "inbound", type: message.type, body, status: "received", timestamp: now, createdAt: now });

  if (conversation?.status === "human") return NextResponse.json({ received: true });

  const reply = await generateReply(body, name);
  const result = await sendText(from, reply);
  const outboundId = result?.messages?.[0]?.id;

  await messages.insertOne({ conversationId: conversation._id, whatsappMessageId: outboundId, direction: "outbound", type: "text", body: reply, status: "sent", timestamp: new Date(), createdAt: new Date() });
  await conversations.updateOne({ _id: conversation._id }, { $set: { lastMessageAt: new Date(), updatedAt: new Date() } });

  return NextResponse.json({ received: true });
}
