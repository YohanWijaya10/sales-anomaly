export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getDateRange(
  date: string
): { startOfDay: string; endOfDay: string } {
  const offsetMinutes = getBusinessTzOffsetMinutes();
  const [year, month, day] = date.split("-").map(Number);
  const offsetMs = offsetMinutes * 60 * 1000;
  const startUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMs);
  const endUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMs);
  return {
    startOfDay: startUtc.toISOString(),
    endOfDay: endUtc.toISOString(),
  };
}

export function getDaysAgo(days: number): string {
  const offsetMinutes = getBusinessTzOffsetMinutes();
  const offsetMs = offsetMinutes * 60 * 1000;
  const date = new Date(Date.now() + offsetMs);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().split("T")[0];
}

export function getDatesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = parseDate(from);
  const end = parseDate(to);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

const BUSINESS_TZ_OFFSET = process.env.BUSINESS_TZ_OFFSET || "+07:00";

export function getBusinessTzOffsetMinutes(): number {
  const match = BUSINESS_TZ_OFFSET.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

export function getLastCompleteWeekRange(): { from: string; to: string } {
  const offsetMinutes = getBusinessTzOffsetMinutes();
  const offsetMs = offsetMinutes * 60 * 1000;
  const nowBiz = new Date(Date.now() + offsetMs);
  const utcDay = nowBiz.getUTCDay(); // 0 = Sunday in business time
  const endBiz = new Date(
    Date.UTC(nowBiz.getUTCFullYear(), nowBiz.getUTCMonth(), nowBiz.getUTCDate())
  );

  if (utcDay !== 0) {
    endBiz.setUTCDate(endBiz.getUTCDate() - utcDay);
  }

  const startBiz = new Date(endBiz);
  startBiz.setUTCDate(startBiz.getUTCDate() - 6);

  return {
    from: startBiz.toISOString().split("T")[0],
    to: endBiz.toISOString().split("T")[0],
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
