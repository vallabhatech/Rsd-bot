const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function sendText(to: string, body: string) {
  if (!token || !phoneNumberId) throw new Error("WhatsApp credentials are missing");

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body },
      }),
      cache: "no-store",
    },
  );

  const data = await response.json();
  if (!response.ok) throw new Error(`WhatsApp API ${response.status}: ${JSON.stringify(data)}`);
  return data;
}
