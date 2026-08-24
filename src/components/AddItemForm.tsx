"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Domain, DOMAINS, TaskType } from "@/lib/types";
import { format } from "date-fns";

export default function AddItemForm({
  userId,
  defaultDomain,
  onDone,
}: {
  userId: string;
  defaultDomain: Domain | "general";
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"task" | "event">("task");
  const [domain, setDomain] = useState<Domain>(
    defaultDomain === "general" ? "work" : defaultDomain
  );
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("once");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Γράψε έναν τίτλο.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    if (kind === "task") {
      const { error } = await supabase.from("tasks").insert({
        user_id: userId,
        domain,
        title: title.trim(),
        type: taskType,
      });
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("events").insert({
        user_id: userId,
        domain,
        title: title.trim(),
        event_date: date,
        start_time: startTime,
        end_time: endTime || null,
        location: location || null,
      });
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <TogglePill active={kind === "task"} onClick={() => setKind("task")} label="Task" />
        <TogglePill active={kind === "event"} onClick={() => setKind("event")} label="Event" />
      </div>

      {defaultDomain === "general" && (
        <select value={domain} onChange={(e) => setDomain(e.target.value as Domain)} style={fieldStyle}>
          {DOMAINS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      )}

      <input
        placeholder="Τίτλος"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={fieldStyle}
      />

      {kind === "task" ? (
        <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)} style={fieldStyle}>
          <option value="once">Εφάπαξ</option>
          <option value="daily">Καθημερινό</option>
          <option value="weekly">Εβδομαδιαίο</option>
          <option value="monthly">Μηνιαίο</option>
        </select>
      ) : (
        <>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ ...fieldStyle, flex: 1 }}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ ...fieldStyle, flex: 1 }}
              placeholder="Λήξη"
            />
          </div>
          <input
            placeholder="Τοποθεσία (προαιρετικό)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={fieldStyle}
          />
        </>
      )}

      {error && <p style={{ color: "#a32d2d", fontSize: 13 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-general)",
            color: "#fff",
            fontWeight: 500,
          }}
        >
          {saving ? "..." : "Προσθήκη"}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "transparent",
          }}
        >
          Άκυρο
        </button>
      </div>
    </form>
  );
}

function TogglePill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: active ? "var(--accent-general)" : "transparent",
        color: active ? "#fff" : "var(--ink)",
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "#fff",
};
