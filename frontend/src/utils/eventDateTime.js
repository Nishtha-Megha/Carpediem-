const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatEventDate(value, fallback = "Not set") {
  if (!value) return fallback;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatEventTime(value, fallback = "") {
  if (!value) return fallback;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return String(value);
  let [, hour, minute, period] = match;
  hour = Number(hour);
  period = period?.toUpperCase() || (hour >= 12 ? "PM" : "AM");
  return `${hour % 12 || 12}:${minute} ${period}`;
}

export function formatEventDateTime(date, time) {
  return [formatEventDate(date, ""), formatEventTime(time, "")].filter(Boolean).join(" at ");
}

export function splitEventTime(value) {
  if (!value) return { time: "", period: "AM" };
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return { time: String(value), period: "AM" };
  let [, hour, minute, period] = match;
  hour = Number(hour);
  period = period?.toUpperCase() || (hour >= 12 ? "PM" : "AM");
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return { time: `${String(hour).padStart(2, "0")}:${minute}`, period };
}

export function toMeridiemTime(time, period = "AM") {
  const match = String(time || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${Number(match[1]) % 12 || 12}:${match[2]} ${period === "PM" ? "PM" : "AM"}`;
}