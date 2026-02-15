import { useEffect, useMemo, useState } from "react";

type NowPlaying = { artist: string; title: string; startedAt: string };
type RequestMsg = { id: string; name: string; message: string; createdAt: string };

export default function App() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [requests, setRequests] = useState<RequestMsg[]>([]);

  const wsUrl = useMemo(() => import.meta.env.VITE_REQUESTS_WS ?? "ws://localhost:4002", []);
  const apiUrl = useMemo(() => import.meta.env.VITE_REQUESTS_API ?? "http://localhost:4002", []);

  useEffect(() => {
    fetch(`${apiUrl}/requests`)
      .then((r) => r.json())
      .then(setRequests)
      .catch(() => {});
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "request.created") setRequests((r) => [msg.data, ...r]);
    };
    return () => ws.close();
  }, [wsUrl, apiUrl]);

  return (
    <div style={{ fontFamily: "system-ui", background: "#0b0f14", color: "#e8eef6", minHeight: "100vh", padding: 16 }}>
      <h2 style={{ margin: 0 }}>AI Radio Console</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div style={{ background: "#111824", borderRadius: 12, padding: 12 }}>
          <div style={{ opacity: 0.8, marginBottom: 8 }}>Decks (placeholder)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {["A", "B", "C", "D"].map((d) => (
              <div key={d} style={{ background: "#0e1520", borderRadius: 10, padding: 10, height: 120 }}>
                <div style={{ fontWeight: 700 }}>Deck {d}</div>
                <div style={{ marginTop: 8, height: 50, background: "#0b0f14", borderRadius: 8 }} />
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button style={btn()}>CUE</button>
                  <button style={btn()}>PLAY</button>
                  <button style={btn()}>SYNC</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#111824", borderRadius: 12, padding: 12 }}>
          <div style={{ opacity: 0.8, marginBottom: 8 }}>Ask the DJ (inbox)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {requests.slice(0, 8).map((r) => (
              <div key={r.id} style={{ background: "#0e1520", borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ opacity: 0.85 }}>{r.message}</div>
                <div style={{ opacity: 0.6, fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, background: "#111824", borderRadius: 12, padding: 12 }}>
        <div style={{ opacity: 0.8 }}>Now Playing (wired in later via WS/NATS bridge)</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>
          {nowPlaying ? `${nowPlaying.artist} — ${nowPlaying.title}` : "—"}
        </div>
      </div>
    </div>
  );
}

function btn() {
  return {
    background: "#0e1520",
    color: "#e8eef6",
    border: "1px solid #1b2a3d",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
  } as const;
}
