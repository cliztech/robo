import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_REQUESTS_API ?? "http://localhost:4002";

  async function submitRequest() {
    setStatus("Sending...");
    try {
      const res = await fetch(`${apiUrl}/requests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      setStatus(data.ok ? `Sent (${data.id})` : "Failed");
      if (data.ok) setMessage("");
    } catch {
      setStatus("Network error");
    }
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <h1>Remote DJ</h1>
      <p>Now playing and request controls (MVP).</p>
      <button style={{ width: "100%", padding: 12, marginBottom: 12 }}>Emergency Stop</button>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask the DJ" style={{ width: "100%", padding: 10, minHeight: 96 }} />
      <button onClick={submitRequest} style={{ width: "100%", marginTop: 8, padding: 10 }}>Send Request</button>
      {status ? <p>{status}</p> : null}
    </main>
  );
}
