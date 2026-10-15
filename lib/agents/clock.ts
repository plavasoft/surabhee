export type KolkataDay = {
  day: string;
  thursday: boolean;
  label: string;
};

export function kolkataNow(date = new Date()): KolkataDay {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = map.weekday ?? "";
  return {
    day: `${map.year}-${map.month}-${map.day}`,
    thursday: weekday === "Thu",
    label: `${weekday} ${map.day}/${map.month}/${map.year}`,
  };
}

export function nextThursday(from = new Date()) {
  for (let step = 0; step <= 7; step += 1) {
    const date = new Date(from.getTime() + step * 24 * 60 * 60 * 1000);
    if (kolkataNow(date).thursday) return date;
  }
  return from;
}
