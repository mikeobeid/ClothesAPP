export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey) ?? new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function isValidDateKey(value: string): boolean {
  return parseDateKey(value) !== null;
}

export function addMonths(dateKey: string, months: number): string {
  const date = parseDateKey(dateKey) ?? new Date();
  date.setMonth(date.getMonth() + months);
  return toDateKey(date);
}

export function getMonthYearLabel(dateKey: string): string {
  const date = parseDateKey(dateKey) ?? new Date();
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function getCalendarMonthKey(dateKey: string): string {
  const date = parseDateKey(dateKey) ?? new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
