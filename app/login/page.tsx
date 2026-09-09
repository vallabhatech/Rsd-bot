"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!res.ok) { setError("Invalid password"); return; }
    router.push("/dashboard"); router.refresh();
  }

  return <main className="login card"><h1>RSD Bot</h1><p className="muted">Admin dashboard</p><form onSubmit={submit}><input className="input" type="password" placeholder="Admin password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="btn" style={{marginTop:12,width:"100%"}}>Sign in</button></form>{error && <p className="error">{error}</p>}</main>;
}
