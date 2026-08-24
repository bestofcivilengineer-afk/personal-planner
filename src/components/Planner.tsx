"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Domain, DOMAINS, EventItem, Task, TaskCompletion, ViewMode, TASK_TYPE_LABELS } from "@/lib/types";
import { isTaskDueOn, isTaskDoneOn } from "@/lib/taskLogic";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
} from "date-fns";
import { el } from "date-fns/locale";
import AddItemForm from "./AddItemForm";

type TabKey = Domain | "general";

export default function Planner({ userId }: { userId: string }) {
  const [tab, setTab] = useState<TabKey>("general");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [itemFilter, setItemFilter] = useState<"all" | "events" | "tasks">("all");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tasksRes, completionsRes, eventsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("active", true),
      supabase.from("task_completions").select("*"),
      supabase.from("events").select("*"),
    ]);
    setTasks((tasksRes.data as Task[]) ?? []);
    setCompletions((completionsRes.data as TaskCompletion[]) ?? []);
    setEvents((eventsRes.data as EventItem[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const range = useMemo(() => {
    if (viewMode === "day") return { start: anchorDate, end: anchorDate };
    if (viewMode === "week")
      return {
        start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
        end: endOfWeek(anchorDate, { weekStartsOn: 1 }),
      };
    return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
  }, [viewMode, anchorDate]);

  const days = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range]
  );

  const domainFilter = (d: Domain) => tab === "general" || tab === d;

  const visibleTasks = tasks.filter((t) => domainFilter(t.domain));
  const visibleEvents = events.filter((e) => domainFilter(e.domain));

  function stepDate(dir: 1 | -1) {
    if (viewMode === "day") setAnchorDate((d) => addDays(d, dir));
    else if (viewMode === "week") setAnchorDate((d) => addWeeks(d, dir));
    else setAnchorDate((d) => addMonths(d, dir));
  }

  async function toggleTask(task: Task, date: Date, done: boolean) {
    const dateStr = format(date, "yyyy-MM-dd");
    if (done) {
      // remove completion(s) for that date (or any completion if "once")
      const toRemove = completions.filter(
        (c) => c.task_id === task.id && (task.type === "once" || c.completed_on === dateStr)
      );
      for (const c of toRemove) {
        await supabase.from("task_completions").delete().eq("id", c.id);
      }
    } else {
      await supabase.from("task_completions").insert({ task_id: task.id, completed_on: dateStr });
    }
    loadData();
  }

  const label = useMemo(() => {
    if (viewMode === "day") return format(anchorDate, "EEEE d MMMM", { locale: el });
    if (viewMode === "week")
      return `${format(range.start, "d MMM", { locale: el })} – ${format(range.end, "d MMM", { locale: el })}`;
    return format(anchorDate, "LLLL yyyy", { locale: el });
  }, [viewMode, anchorDate, range]);

  const activeColor =
    tab === "general" ? "var(--accent-general)" : `var(--accent-${tab})`;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Domain tabs */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          background: "var(--paper)",
          zIndex: 10,
        }}
      >
        <TabButton
          active={tab === "general"}
          label="Γενικά"
          color="var(--accent-general)"
          onClick={() => setTab("general")}
        />
        {DOMAINS.map((d) => (
          <TabButton
            key={d.key}
            active={tab === d.key}
            label={d.label}
            icon={d.icon}
            color={`var(--accent-${d.key})`}
            onClick={() => setTab(d.key)}
          />
        ))}
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* View mode toggle */}
        <div style={{ display: "flex", gap: 6, margin: "14px 0 10px" }}>
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                flex: 1,
                padding: "7px 0",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: viewMode === v ? activeColor : "transparent",
                color: viewMode === v ? "#fff" : "var(--ink)",
              }}
            >
              {v === "day" ? "Ημέρα" : v === "week" ? "Εβδομάδα" : "Μήνας"}
            </button>
          ))}
        </div>

        {/* Item filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["all", "events", "tasks"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setItemFilter(f)}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                borderRadius: 999,
                border: "1px solid var(--line)",
                background: itemFilter === f ? "var(--ink)" : "transparent",
                color: itemFilter === f ? "#fff" : "var(--ink-soft)",
              }}
            >
              {f === "all" ? "Όλα" : f === "events" ? "Μόνο events" : "Μόνο tasks"}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0" }}>
          <button onClick={() => stepDate(-1)} style={navBtn}>
            <i className="ti ti-chevron-left" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 15, textTransform: "capitalize" }}>{label}</span>
            <button onClick={() => setAnchorDate(new Date())} style={{ fontSize: 12, color: "var(--ink-soft)", background: "none", border: "none" }}>
              σήμερα
            </button>
          </div>
          <button onClick={() => stepDate(1)} style={navBtn}>
            <i className="ti ti-chevron-right" />
          </button>
        </div>

        {/* List */}
        {loading ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Φόρτωση…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: viewMode === "day" ? 8 : 18 }}>
            {days.map((day) => {
              const dayEvents =
                itemFilter === "tasks"
                  ? []
                  : visibleEvents
                      .filter((e) => isSameDay(new Date(e.event_date), day))
                      .sort((a, b) => a.start_time.localeCompare(b.start_time));
              const dayTasks =
                itemFilter === "events"
                  ? []
                  : visibleTasks.filter((t) => isTaskDueOn(t, day, completions));

              if (viewMode !== "day" && dayEvents.length === 0 && dayTasks.length === 0) return null;

              return (
                <div key={day.toISOString()}>
                  {viewMode !== "day" && (
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-soft)", marginBottom: 6, textTransform: "capitalize" }}>
                      {format(day, "EEEE d MMM", { locale: el })}
                    </div>
                  )}
                  {dayEvents.length === 0 && dayTasks.length === 0 && viewMode === "day" && (
                    <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Καμία εργασία ή συνάντηση.</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          display: "flex",
                          gap: 8,
                          padding: 8,
                          background: `color-mix(in srgb, var(--accent-${ev.domain}) 10%, white)`,
                          borderRadius: 8,
                          borderLeft: `3px solid var(--accent-${ev.domain})`,
                        }}
                      >
                        <i className="ti ti-clock" style={{ fontSize: 16, marginTop: 2, color: `var(--accent-${ev.domain})` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                            {ev.start_time.slice(0, 5)}
                            {ev.end_time ? `–${ev.end_time.slice(0, 5)}` : ""}
                            {ev.location ? ` · ${ev.location}` : ""}
                            {tab === "general" ? ` · ${DOMAINS.find((d) => d.key === ev.domain)?.label}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                    {dayTasks.map((task) => {
                      const done = isTaskDoneOn(task, day, completions);
                      return (
                        <div
                          key={task.id + day.toISOString()}
                          onClick={() => toggleTask(task, day, done)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: 8,
                            border: "1px solid var(--line)",
                            borderRadius: 8,
                            cursor: "pointer",
                            opacity: done ? 0.5 : 1,
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: `1.5px solid var(--accent-${task.domain})`,
                              background: done ? `var(--accent-${task.domain})` : "transparent",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, textDecoration: done ? "line-through" : "none" }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                              {TASK_TYPE_LABELS[task.type]}
                              {tab === "general" ? ` · ${DOMAINS.find((d) => d.key === task.domain)?.label}` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add */}
        {showAdd ? (
          <AddItemForm
            userId={userId}
            defaultDomain={tab}
            onDone={() => {
              setShowAdd(false);
              loadData();
            }}
          />
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--card)",
              fontSize: 14,
            }}
          >
            <i className="ti ti-plus" style={{ marginRight: 6 }} />
            Νέα προσθήκη
          </button>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  icon,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  icon?: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 14px",
        fontSize: 13,
        whiteSpace: "nowrap",
        background: "none",
        border: "none",
        borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
        color: active ? color : "var(--ink-soft)",
        fontWeight: active ? 500 : 400,
      }}
    >
      {icon && <i className={`ti ${icon}`} style={{ marginRight: 4, verticalAlign: -2 }} />}
      {label}
    </button>
  );
}

const navBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 18,
  color: "var(--ink-soft)",
  padding: 6,
};
