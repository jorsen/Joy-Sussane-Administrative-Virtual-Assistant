/**
 * Utility functions for the Joy Sussane VA Portal
 */

/**
 * Generates an ICS calendar file and triggers a browser download.
 * @param {Array} tasks - Array of task objects with id, title, description, due_date
 * @param {string} filename - Output filename (default: 'tasks.ics')
 */
export function downloadIcs(tasks, filename = 'tasks.ics') {
  const formatIcsDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const escapeIcs = (str) =>
    (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const events = tasks
    .filter((t) => t.due_date)
    .map((t) => {
      const dateStr = formatIcsDate(t.due_date);
      return [
        'BEGIN:VEVENT',
        `UID:${t.id}@joy-sussane-va`,
        `SUMMARY:${escapeIcs(t.title)}`,
        `DESCRIPTION:${escapeIcs(t.description)}`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        'END:VEVENT',
      ].join('\r\n');
    });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Joy Sussane VA Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a single task as an ICS file.
 * @param {Object} task - Task object with id, title, description, due_date
 */
export function downloadSingleIcs(task) {
  const filename = task.title.replace(/\s+/g, '-').toLowerCase() + '.ics';
  downloadIcs([task], filename);
}

/**
 * Formats a number as a USD currency string.
 * @param {number} amount
 * @returns {string} e.g. '$1,234.50'
 */
export function formatMoney(amount) {
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Returns a relative time string from a date string.
 * @param {string} dateStr
 * @returns {string} e.g. "2 hours ago", "just now", "Jun 3, 2026"
 */
export function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffSeconds < 604800) {
    const days = Math.floor(diffSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a date string as a localized date string.
 * @param {string} dateStr - Date string (date-only, e.g. '2026-06-03')
 * @param {Object} [opts] - Intl.DateTimeFormat options
 * @returns {string} e.g. "Jun 3, 2026"
 */
export function formatDate(dateStr, opts) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(
    'en-US',
    opts || { month: 'short', day: 'numeric', year: 'numeric' }
  );
}
