export type Domain = "work" | "university" | "scouting" | "personal";
export type TaskType = "daily" | "weekly" | "monthly" | "once" | "weekdays" | "daily_except_sunday";
export type ViewMode = "day" | "week" | "month";

export interface DomainConfig {
  key: Domain;
  label: string;
  icon: string;
  color: string; // hex accent
}

export const DOMAINS: DomainConfig[] = [
  { key: "work", label: "Δουλειά", icon: "💼", color: "#3D5A80" },
  { key: "university", label: "Πανεπιστήμιο", icon: "🎓", color: "#B5891C" },
  { key: "scouting", label: "Προσκοπικό", icon: "⛺", color: "#2F6B4F" },
  { key: "personal", label: "Προσωπικά", icon: "👤", color: "#7A4869" },
];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  daily: "Καθημερινό",
  weekly: "Εβδομαδιαίο",
  monthly: "Μηνιαίο",
  once: "Εφάπαξ",
  weekdays: "Εργάσιμες μέρες",
  daily_except_sunday: "Καθημερινά εκτός Κυριακής",
};

export interface Task {
  id: string;
  domain: Domain;
  title: string;
  type: TaskType;
  active: boolean;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  completed_on: string; // yyyy-MM-dd
}

export interface EventItem {
  id: string;
  domain: Domain;
  title: string;
  event_date: string; // yyyy-MM-dd
  start_time: string; // HH:mm
  end_time: string | null;
  location: string | null;
}

export interface NoteTopic {
  id: string;
  title: string;
  created_at: string;
}

export interface NoteItem {
  id: string;
  topic_id: string;
  text: string;
  done: boolean;
  created_at: string;
  done_at: string | null;
}
