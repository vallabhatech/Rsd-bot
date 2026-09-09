import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/mongodb";

export default async function Dashboard() {
  if (!(await isAdmin())) redirect("/login");
  const database = await db();
  const [contacts, conversations, messages] = await Promise.all([
    database.collection("contacts").countDocuments(),
    database.collection("conversations").countDocuments({ status: "open" }),
    database.collection("messages").countDocuments(),
  ]);

  return <main className="shell"><header className="top"><div><div className="brand">RSD Bot</div><div className="muted">WhatsApp automation control center</div></div><span className="badge">● API ready</span></header><section className="grid"><div className="card"><div className="muted">Contacts</div><div className="stat">{contacts}</div></div><div className="card"><div className="muted">Open conversations</div><div className="stat">{conversations}</div></div><div className="card"><div className="muted">Messages</div><div className="stat">{messages}</div></div></section><section className="card panel"><h2>Bot flow</h2><div className="row"><span>Incoming WhatsApp message</span><span className="badge">Webhook</span></div><div className="row"><span>Store contact + message</span><span className="badge">MongoDB</span></div><div className="row"><span>Generate automated reply</span><span className="badge">AI / fallback</span></div><div className="row"><span>Send response</span><span className="badge">Cloud API</span></div></section><section className="card panel"><h2>Configuration</h2><p className="muted">Set the variables from <code>.env.example</code>. Never commit real access tokens, app secrets, or database credentials.</p></section></main>;
}
