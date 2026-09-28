export function tzOffsetFrom(sp: URLSearchParams) {
  const n = Number(sp.get("tz"));
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
}

export function tzString(tzOffsetMin: number) {
  const off = -tzOffsetMin;
  const sign = off >= 0 ? "+" : "-";
  const a = Math.abs(off);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

export function rangeWindow(range: string, tzOffsetMin = 0) {
  const DAY = 86400000;
  const shifted = new Date(Date.now() - tzOffsetMin * 60000);
  const todayStart =
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) + tzOffsetMin * 60000;
  const back = range === "7d" ? 6 : range === "30d" ? 29 : range === "90d" ? 89 : 0;
  return { start: new Date(todayStart - back * DAY), end: new Date(todayStart + DAY - 1) };
}
