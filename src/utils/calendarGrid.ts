import { parseDateKey, toDateKey } from './dateFormat';

export type CalendarDayCell = {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getWeekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

export function buildMonthGrid(monthAnchorDateKey: string): CalendarDayCell[] {
  const anchor = parseDateKey(monthAnchorDateKey) ?? new Date();
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDayCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startOffset + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      const spillDate = new Date(year, month, dayNumber);
      cells.push({
        dateKey: toDateKey(spillDate),
        day: spillDate.getDate(),
        inCurrentMonth: false,
      });
      continue;
    }

    const date = new Date(year, month, dayNumber);
    cells.push({
      dateKey: toDateKey(date),
      day: dayNumber,
      inCurrentMonth: true,
    });
  }

  return cells;
}
