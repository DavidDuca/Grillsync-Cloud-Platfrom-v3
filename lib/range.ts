export function rangeWindow(range: string) {
  const now = new Date();
  const end = now;
  const start = new Date(now);
  if (range === "today") { start.setHours(0,0,0,0); }
  else if (range === "7d")  { start.setDate(now.getDate() - 6);  start.setHours(0,0,0,0); }
  else if (range === "30d") { start.setDate(now.getDate() - 29); start.setHours(0,0,0,0); }
  else if (range === "90d") { start.setDate(now.getDate() - 89); start.setHours(0,0,0,0); }
  else { start.setHours(0,0,0,0); }
  return { start, end };
}
