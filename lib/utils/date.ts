export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
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
  return {
    startOfDay: `${date}T00:00:00.000Z`,
    endOfDay: `${date}T23:59:59.999Z`,
  };
}

export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
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
