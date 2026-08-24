"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Λάθος email ή κωδικός.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 340,
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: 28,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Σύνδεση</h1>
        <label style={{ fontSize: 13, color: "var(--ink-soft)" }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <label style={{ fontSize: 13, color: "var(--ink-soft)" }}>Κωδικός</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        {error && (
          <p style={{ color: "#a32d2d", fontSize: 13, marginTop: 8 }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-general)",
            color: "#fff",
            fontWeight: 500,
          }}
        >
          {loading ? "..." : "Είσοδος"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  marginTop: 4,
  marginBottom: 14,
  borderRadius: 8,
  border: "1px solid var(--line)",
  display: "block",
};
