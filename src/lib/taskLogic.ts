import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from "date-fns";
import { Task, TaskCompletion } from "./types";

// Is this task "due" (should appear, not yet done) for the given date?
export function isTaskDueOn(task: Task, date: Date, completions: TaskCompletion[]): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  const taskCompletions = completions.filter((c) => c.task_id === task.id);

  if (task.type === "daily") {
    return !taskCompletions.some((c) => c.completed_on === dateStr);
  }

  if (task.type === "weekly") {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return !taskCompletions.some((c) => isWithinInterval(parseISO(c.completed_on), { start, end }));
  }

  if (task.type === "monthly") {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return !taskCompletions.some((c) => isWithinInterval(parseISO(c.completed_on), { start, end }));
  }

  if (task.type === "weekdays") {
    const dow = date.getDay(); // 0 = Κυριακή, 6 = Σάββατο
    if (dow === 0 || dow === 6) return false;
    return !taskCompletions.some((c) => c.completed_on === dateStr);
  }

  if (task.type === "daily_except_sunday") {
    if (date.getDay() === 0) return false;
    return !taskCompletions.some((c) => c.completed_on === dateStr);
  }

  // once: stays "due" from its creation date up to and including today, until it's
  // completed. It never shows on future dates it hasn't "arrived" at yet — it only
  // starts appearing on the next day if it was left undone.
  const createdDate = format(parseISO(task.created_at), "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  return taskCompletions.length === 0 && dateStr >= createdDate && dateStr <= todayStr;
}

// Is this task checked off ON this specific date (for showing checkbox state)?
export function isTaskDoneOn(task: Task, date: Date, completions: TaskCompletion[]): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  const taskCompletions = completions.filter((c) => c.task_id === task.id);

  if (task.type === "once") {
    // once done, it's done everywhere (it disappears via isTaskDueOn anyway)
    return taskCompletions.length > 0;
  }

  return taskCompletions.some((c) => c.completed_on === dateStr);
}
