export async function generateReply(userText: string, name?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackReply(userText, name);

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a concise WhatsApp customer-support assistant. Be helpful, professional and never claim an action was completed unless the system confirms it. If you cannot answer, suggest human support.",
        },
        { role: "user", content: userText },
      ],
      max_output_tokens: 300,
    }),
  });

  if (!response.ok) return fallbackReply(userText, name);
  const data = await response.json();
  const text = data.output_text;
  return typeof text === "string" && text.trim() ? text.trim() : fallbackReply(userText, name);
}

function fallbackReply(userText: string, name?: string) {
  const greeting = name ? `Hi ${name}! 👋` : "Hello! 👋";
  const text = userText.toLowerCase().trim();
  if (["hi", "hello", "hey", "start"].includes(text)) {
    return `${greeting}\n\nWelcome! How can I help you today?\n\n1️⃣ Products\n2️⃣ Pricing\n3️⃣ Support\n4️⃣ Talk to a human`;
  }
  if (text === "1") return "Please tell me which product you are interested in.";
  if (text === "2") return "Please tell me which plan or product you want pricing for.";
  if (text === "3" || text === "4" || text.includes("human")) {
    return "Sure. I’ll route this to human support. Please wait for an agent to respond.";
  }
  return `${greeting}\n\nThanks for your message. A team member can help you shortly.`;
}
