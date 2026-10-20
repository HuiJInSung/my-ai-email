const TIME_ZONE = "Asia/Taipei";

// 回傳台北時區的日期字串 YYYY-MM-DD
export function taipeiDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
