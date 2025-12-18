import { useState } from "react";

function App() {
  const [problem, setProblem] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  async function askGita() {
    if (!problem.trim()) return;

    setLoading(true);
    setResponse(null);

    const res = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/ask",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem })
      }
    );

    const data = await res.json();
    setResponse(data);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>🕉️ GitaGuide</h1>
      <p>Ancient wisdom for modern problems</p>

      <textarea
        rows="4"
        style={{ width: "100%", padding: 10 }}
        placeholder="Tell me what’s troubling you..."
        value={problem}
        onChange={e => setProblem(e.target.value)}
      />

      <br /><br />

      <button onClick={askGita} disabled={loading}>
        {loading ? "Reflecting..." : "Ask Krishna"}
      </button>

      {response && (
        <div style={{ marginTop: 30 }}>
          <h3>📜 Shloka</h3>
          <p>{response.verse}</p>

          <h3>📖 Meaning</h3>
          <p>{response.meaning}</p>

          <h3>🧠 Guidance</h3>
          <p>{response.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default App;

