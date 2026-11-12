const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Local yyyy-mm-dd key (used to group tasks by day on the calendar). */
export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "Today" / "Tomorrow" / "Oct 12" (+ year when it differs). */
export function formatShortDate(date) {
  const d = new Date(date);
  const today = startOfDay();
  const diff = Math.round((startOfDay(d) - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const sameYear = d.getFullYear() === today.getFullYear();
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}${sameYear ? '' : `, ${d.getFullYear()}`}`;
}

/** Compact due-date chip: { text, tone } where tone drives the color. */
export function dueMeta(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const today = startOfDay();
  const diff = Math.round((startOfDay(d) - today) / 86400000);
  const text = formatShortDate(d);
  let tone = 'normal';
  if (diff < 0) tone = 'overdue';
  else if (diff === 0) tone = 'today';
  else if (diff <= 3) tone = 'soon';
  return { text, tone };
}

/** "just now", "5m ago", "3h ago", "2d ago", "Oct 12" */
export function relativeTime(date) {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;
  return formatShortDate(d);
}

export function monthLabel(year, month) {
  return `${MONTHS[month]} ${year}`;
}

export function weekdayHeader() {
  // Monday-first week, matching the calendar grid.
  return [1, 2, 3, 4, 5, 6, 0].map((i) => WEEKDAYS_SHORT[i]);
}

/** 6x7 Monday-first grid for the month containing (year, month). */
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = addDays(first, -startOffset);
  const weeks = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w += 1) {
    const week = [];
    for (let day = 0; day < 7; day += 1) {
      week.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** yyyy-mm-dd for <input type="date"> */
export function toInputValue(date) {
  if (!date) return '';
  return dateKey(new Date(date));
}

/** Parses an <input type="date"> value into a local Date (or null). */
export function fromInputValue(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function longDate(date = new Date()) {
  const d = new Date(date);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
