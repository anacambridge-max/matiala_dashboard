export function formatDateLabel(isoDate: string): { day: string; date: string; month: string } {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.toLocaleDateString("en-IN", { weekday: "short" });
  const date = d.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  return { day, date, month };
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
