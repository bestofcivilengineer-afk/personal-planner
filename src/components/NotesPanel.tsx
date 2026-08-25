"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { NoteTopic, NoteItem } from "@/lib/types";

export default function NotesPanel({ userId }: { userId: string }) {
  const [topics, setTopics] = useState<NoteTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<NoteTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  const supabase = createClient();

  const loadTopics = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("note_topics").select("*").order("created_at", { ascending: false });
    setTopics((data as NoteTopic[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  async function createTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const { data } = await supabase
      .from("note_topics")
      .insert({ user_id: userId, title: newTopicTitle.trim() })
      .select()
      .single();
    setNewTopicTitle("");
    setNewTopicOpen(false);
    await loadTopics();
    if (data) setSelectedTopic(data as NoteTopic);
  }

  async function deleteTopic(topic: NoteTopic) {
    if (!window.confirm(`Διαγραφή του θέματος "${topic.title}" και όλων των σημειώσεών του;`)) return;
    await supabase.from("note_topics").delete().eq("id", topic.id);
    setSelectedTopic(null);
    loadTopics();
  }

  if (selectedTopic) {
    return (
      <TopicDetail
        topic={selectedTopic}
        onBack={() => {
          setSelectedTopic(null);
          loadTopics();
        }}
        onDelete={() => deleteTopic(selectedTopic)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Σημειώσεις</h1>

      {newTopicOpen ? (
        <form onSubmit={createTopic} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            autoFocus
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="Τίτλος θέματος"
            style={{
              flex: 1,
              padding: "9px 10px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "#fff",
            }}
          />
          <button
            type="submit"
            style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "var(--accent-general)", color: "#fff" }}
          >
            Δημιουργία
          </button>
          <button
            type="button"
            onClick={() => setNewTopicOpen(false)}
            style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "transparent" }}
          >
            Άκυρο
          </button>
        </form>
      ) : (
        <button
          onClick={() => setNewTopicOpen(true)}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "var(--card)",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          <span style={{ marginRight: 6 }}>+</span>
          Νέο θέμα
        </button>
      )}

      {loading ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Φόρτωση…</p>
      ) : topics.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Δεν έχεις θέματα ακόμα.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t)}
              style={{
                aspectRatio: "1 / 1",
                border: "1px solid var(--line)",
                borderRadius: 12,
                background: "var(--card)",
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicDetail({
  topic,
  onBack,
  onDelete,
}: {
  topic: NoteTopic;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [items, setItems] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");

  const supabase = createClient();

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("note_items")
      .select("*")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });
    setItems((data as NoteItem[]) ?? []);
    setLoading(false);
  }, [supabase, topic.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemText.trim()) return;
    await supabase.from("note_items").insert({ topic_id: topic.id, text: newItemText.trim() });
    setNewItemText("");
    loadItems();
  }

  async function toggleItem(item: NoteItem) {
    await supabase
      .from("note_items")
      .update({ done: !item.done, done_at: !item.done ? new Date().toISOString() : null })
      .eq("id", item.id);
    loadItems();
  }

  const unchecked = items.filter((i) => !i.done);
  const checked = items.filter((i) => i.done).sort((a, b) => (a.done_at ?? "").localeCompare(b.done_at ?? ""));
  const ordered = [...unchecked, ...checked];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 14, color: "var(--ink-soft)", padding: 0 }}>
          ← Πίσω
        </button>
        <button onClick={onDelete} style={{ background: "none", border: "none", fontSize: 13, color: "var(--ink-soft)" }}>
          🗑 Διαγραφή θέματος
        </button>
      </div>

      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{topic.title}</h1>

      {loading ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Φόρτωση…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {ordered.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 4px",
                cursor: "pointer",
                opacity: item.done ? 0.45 : 1,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "1.5px solid var(--ink-soft)",
                  background: item.done ? "var(--ink-soft)" : "transparent",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
            </div>
          ))}
          {ordered.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Καμία σημείωση ακόμα.</p>}
        </div>
      )}

      <form onSubmit={addItem} style={{ display: "flex", gap: 8 }}>
        <input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Νέα σημείωση…"
          style={{
            flex: 1,
            padding: "9px 10px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "#fff",
          }}
        />
        <button
          type="submit"
          style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "var(--accent-general)", color: "#fff" }}
        >
          +
        </button>
      </form>
    </div>
  );
}
